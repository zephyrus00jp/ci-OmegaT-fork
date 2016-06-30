/**************************************************************************
 OmegaT - Computer Assisted Translation (CAT) tool 
          with fuzzy matching, translation memory, keyword search, 
          glossaries, and translation leveraging into updated projects.

 Copyright (C) 2000-2006 Keith Godfrey and Maxym Mykhalchuk
               2008 Alex Buloichik
               2012 Thomas Cordonnier, Martin Fleurke
               2013 Aaron Madlon-Kay, Alex Buloichik
               Home page: http://www.omegat.org/
               Support center: http://groups.yahoo.com/group/OmegaT/

 This file is part of OmegaT.

 OmegaT is free software: you can redistribute it and/or modify
 it under the terms of the GNU General Public License as published by
 the Free Software Foundation, either version 3 of the License, or
 (at your option) any later version.

 OmegaT is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU General Public License for more details.

 You should have received a copy of the GNU General Public License
 along with this program.  If not, see <http://www.gnu.org/licenses/>.
 **************************************************************************/

package org.omegat.core.statistics;

import java.util.ArrayList;
import java.util.Collections;
import java.util.EnumSet;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;
import java.util.function.BiConsumer;
import java.util.function.BinaryOperator;
import java.util.function.Function;
import java.util.function.Predicate;
import java.util.function.Supplier;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collector;
import java.util.stream.Stream;

import org.omegat.core.Core;
import org.omegat.core.data.EntryKey;
import org.omegat.core.data.IProject;
import org.omegat.core.data.TMXEntry;
import org.omegat.core.events.IStopped;
import org.omegat.core.matching.FuzzyMatcher;
import org.omegat.core.matching.ISimilarityCalculator;
import org.omegat.core.matching.LevenshteinDistance;
import org.omegat.core.matching.NearString;
import org.omegat.core.segmentation.Rule;
import org.omegat.tokenizer.ITokenizer;
import org.omegat.util.Language;
import org.omegat.util.OConsts;
import org.omegat.util.OStrings;
import org.omegat.util.PatternConsts;
import org.omegat.util.TMXProp;
import org.omegat.util.Token;

/**
 * Class to find matches by specified criteria.
 * 
 * Since we can use stemmers to prepare tokens, we should use 3-pass comparison of similarity. Similarity will
 * be calculated in 3 steps:
 * 
 * 1. Split original segment into word-only tokens using stemmer (with stop words list), then compare tokens.
 * 
 * 2. Split original segment into word-only tokens without stemmer, then compare tokens.
 * 
 * 3. Split original segment into not-only-words tokens (including numbers and tags) without stemmer, then
 * compare tokens.
 * 
 * This class is not thread safe ! Must be used in the one thread only.
 * 
 * @author Maxym Mykhalchuk
 * @author Alex Buloichik (alex73mail@gmail.com)
 * @author Martin Fleurke
 * @author Aaron Madlon-Kay
 */
public class FindMatches {

    private static final int PENALTY_FOR_FUZZY = 20;
    private static final int PENALTY_FOR_REMOVED = 5;
    private static final int SUBSEGMENT_MATCH_THRESHOLD = 85;

    private static final boolean ALLOW_PARTIALY_MATCH = true;

    private static final Pattern SEARCH_FOR_PENALTY = Pattern.compile("penalty-(\\d+)");

    private static final String ORPHANED_FILE_NAME = OStrings.getString("CT_ORPHAN_STRINGS");

    private final ThreadLocal<ISimilarityCalculator> distance = ThreadLocal.withInitial(LevenshteinDistance::new);

    /**
     * the removePattern that was configured by the user.
     */
    private final Pattern removePattern = PatternConsts.getRemovePattern();

    private final ITokenizer tok;
    private final Locale srcLocale;
    private final int maxCount;

    private final boolean searchExactlyTheSame;
    private String srcText;

    /**
     * Text that was removed by the removePattern from the source text.
     */
    private String removedText;

    /** Tokens for original string, with and without stems. */
    private Token[] strTokensStem, strTokensNoStem;

    /** Tokens for original string, includes numbers and tags. */
    private Token[] strTokensAll;

    // This finder used for search separate segment matches
    private ThreadLocal<FindMatches> separateSegmentMatcher;

    private final boolean isParallel;

    /**
     * @param searchExactlyTheSame
     *            allows to search similarities with the same text as source segment. This mode used only for
     *            separate sentence match in paragraph project, i.e. where source is just part of current
     *            source.
     */
    public FindMatches(ITokenizer sourceTokenizer, int maxCount, boolean allowSeparateSegmentMatch,
            boolean searchExactlyTheSame, boolean canParallelize) {
        tok = sourceTokenizer;
        srcLocale = Core.getProject().getProjectProperties().getSourceLanguage().getLocale();
        this.maxCount = maxCount;
        this.searchExactlyTheSame = searchExactlyTheSame;
        this.isParallel = canParallelize;
        if (allowSeparateSegmentMatch) {
            separateSegmentMatcher = ThreadLocal
                    .withInitial(() -> new FindMatches(sourceTokenizer, 1, false, true, false));
        }
    }

    public List<NearString> search(final IProject project, final String searchText,
            final boolean requiresTranslation, final boolean fillSimilarityData, final IStopped stop)
            throws StoppedException {

        String originalText = searchText;
        srcText = searchText;

        StringBuilder removedText = new StringBuilder();
        // remove part that is to be removed according to user settings.
        // Rationale: it might be a big string influencing the 'editing distance', while it is not really part
        // of the translatable text
        if (removePattern != null) {
            Matcher removeMatcher = removePattern.matcher(srcText);
            while (removeMatcher.find()) {
                removedText.append(removeMatcher.group());
            }
            srcText = removeMatcher.replaceAll("");
        }
        this.removedText = removedText.toString();

        List<Stream<CandidateString>> streams = new ArrayList<>();

        // get tokens for original string
        strTokensStem = tokenizeStem(srcText);
        strTokensNoStem = tokenizeNoStem(srcText);
        strTokensAll = tokenizeAll(srcText);
        /* HP: includes non - word tokens */

        // skip original==original entry comparison
        Predicate<CandidateString> sameFilter = c -> searchExactlyTheSame || !c.source.equals(originalText);
        
        // travel by project entries, including orphaned
        if (project.getProjectProperties().isSupportDefaultTranslations()) {
            streams.add(getDefaultTranslationsStream(project).filter(sameFilter));
        }
        streams.add(getMultipleTranslationsStream(project).filter(sameFilter));

        // travel by translation memories
        streams.add(getTMStream(project));

        // travel by all entries for check source file translations
        streams.add(getEntriesStream(project));

        if (ALLOW_PARTIALY_MATCH && separateSegmentMatcher != null
                && !project.getProjectProperties().isSentenceSegmentingEnabled()) {
            streams.add(getSeparateSegmentStream(project, requiresTranslation, stop, srcText));
        }

        Stream<CandidateString> stream = streams.stream().flatMap(Function.identity())
                .filter(c -> !requiresTranslation || c.translation != null);
        if (isParallel) {
            stream = stream.parallel();
        }

        try {
            List<NearString> result = stream.filter(o -> {
                checkStopped(stop);
                return true;
            }).collect(new MatchCollector());
            if (fillSimilarityData) {
                // fill similarity data only for result
                for (NearString near : result) {
                    // fix for bug 1586397
                    byte[] similarityData = FuzzyMatcher.buildSimilarityData(strTokensAll, tokenizeAll(near.source));
                    near.attr = similarityData;
                }
            }
            System.out.println("Accumulating time: " + accumulating.get() + " ms");
            System.out.println("Combining time: " + combining.get() + " ms");
            System.out.println("Scoring time: " + scoring.get() + " ms");
            System.out.println("Tokenizing time: " + tokenizing.get() + " ms");
            System.out.println("Calc similarity time: " + similarity.get() + " ms");
            System.out.println("Token cache misses: " + tokCacheMisses.get());
            System.out.println("Token cache hits: " + tokCacheHits.get());
            return result;
        } catch (StoppedException ex) {
            return Collections.emptyList();
        }
    }

    Stream<CandidateString> getDefaultTranslationsStream(IProject project) {
        return project.streamDefaultTranslations().map(e -> {
            String source = e.getKey();
            TMXEntry trans = e.getValue();
            String fileName = project.isOrphaned(source) ? ORPHANED_FILE_NAME : null;
            return new CandidateString(null, source, trans.translation, NearString.MATCH_SOURCE.MEMORY, false, 0,
                    fileName, trans.creator, trans.creationDate, trans.changer, trans.changeDate, null);
        });
    }

    Stream<CandidateString> getMultipleTranslationsStream(IProject project) {
        return project.streamMultipleTranslations().map(e -> {
            EntryKey source = e.getKey();
            TMXEntry trans = e.getValue();
            String fileName = project.isOrphaned(source) ? ORPHANED_FILE_NAME : null;
            return new CandidateString(source, source.sourceText, trans.translation, NearString.MATCH_SOURCE.MEMORY, false, 0,
                    fileName, trans.creator, trans.creationDate, trans.changer, trans.changeDate, null);
        });
    }

    Stream<CandidateString> getTMStream(IProject project) {
        return project.getTransMemories().entrySet().stream().flatMap(en -> {
            Matcher matcher = SEARCH_FOR_PENALTY.matcher(en.getKey());
            int penalty = matcher.find() ? Integer.parseInt(matcher.group(1)) : 0;
            return en.getValue().getEntries().stream().map(tmen -> {
                return new CandidateString(null, tmen.source, tmen.translation, NearString.MATCH_SOURCE.TM, false,
                        penalty, en.getKey(), tmen.creator, tmen.creationDate, tmen.changer, tmen.changeDate,
                        tmen.otherProperties);
            });
        });
    }

    Stream<CandidateString> getEntriesStream(IProject project) {
        return project.getAllEntries().stream().filter(ste -> ste.getSourceTranslation() != null).map(ste -> {
            return new CandidateString(ste.getKey(), ste.getSrcText(), ste.getSourceTranslation(),
                    NearString.MATCH_SOURCE.MEMORY, ste.isSourceTranslationFuzzy(), 0, ste.getKey().file, "", 0, "", 0,
                    null);
        });
    }

    Stream<CandidateString> getSeparateSegmentStream(IProject project, boolean requiresTranslation, IStopped stop, String text) {
        // Wrap in outer stream to ensure lazy evaluation
        return Stream.of(text).flatMap(srcText -> {
            // split paragraph even when segmentation disabled, then find
            // matches for every segment
            List<StringBuilder> spaces = new ArrayList<>();
            List<Rule> brules = new ArrayList<>();
            Language sourceLang = project.getProjectProperties().getSourceLanguage();
            Language targetLang = project.getProjectProperties().getTargetLanguage();
            List<String> segments = Core.getSegmenter().segment(sourceLang, srcText, spaces, brules);
            if (segments.size() <= 1) {
                return Stream.empty();
            }
            List<String> fsrc = new ArrayList<>(segments.size());
            List<String> ftrans = new ArrayList<>(segments.size());
            // multiple segments
            for (int i = 0; i < segments.size(); i++) {
                String onesrc = segments.get(i);

                // find match for separate segment
                List<NearString> segmentMatch = separateSegmentMatcher.get().search(project, onesrc,
                        requiresTranslation,
                        false, stop);
                if (!segmentMatch.isEmpty() && segmentMatch.get(0).scores[0].score >= SUBSEGMENT_MATCH_THRESHOLD) {
                    fsrc.add(segmentMatch.get(0).source);
                    ftrans.add(segmentMatch.get(0).translation);
                } else {
                    fsrc.add("");
                    ftrans.add("");
                }
            }
            // glue found sources
            String foundSrc = Core.getSegmenter().glue(sourceLang, sourceLang, fsrc, spaces, brules);
            // glue found translations
            String foundTrans = Core.getSegmenter().glue(sourceLang, targetLang, ftrans, spaces, brules);
            return Stream.of(new CandidateString(null, foundSrc, foundTrans, NearString.MATCH_SOURCE.TM, false, 0, "",
                    "", 0, "", 0, null));
        });
    }

    static class CandidateString {
        final EntryKey key;
        final String source;
        final String translation;
        final NearString.MATCH_SOURCE comesFrom;
        final boolean fuzzy;
        final int penalty;
        final String tmxName;
        final String creator;
        final long creationDate;
        final String changer;
        final long changedDate;
        final List<TMXProp> props;

        public CandidateString(EntryKey key, String source, String translation, NearString.MATCH_SOURCE comesFrom,
                boolean fuzzy, int penalty, String tmxName, String creator, long creationDate, String changer,
                long changedDate, List<TMXProp> props) {
            this.key = key;
            this.source = source;
            this.translation = translation;
            this.comesFrom = comesFrom;
            this.fuzzy = fuzzy;
            this.penalty = penalty;
            this.tmxName = tmxName;
            this.creator = creator;
            this.creationDate = creationDate;
            this.changer = changer;
            this.changedDate = changedDate;
            this.props = props;
        }
    }

    AtomicLong accumulating = new AtomicLong();
    AtomicLong combining = new AtomicLong();
    AtomicLong scoring = new AtomicLong();
    AtomicLong tokenizing = new AtomicLong();
    AtomicLong similarity = new AtomicLong();
    AtomicInteger tokCacheMisses = new AtomicInteger();
    AtomicInteger tokCacheHits = new AtomicInteger();

    class MatchCollector implements Collector<CandidateString, List<NearString>, List<NearString>> {

        @Override
        public Supplier<List<NearString>> supplier() {
            return () -> new ArrayList<>(OConsts.MAX_NEAR_STRINGS + 1);
        }

        @Override
        public BiConsumer<List<NearString>, CandidateString> accumulator() {
            return (result, candidate) -> {
                long start = System.currentTimeMillis();
                scoreEntry(result, candidate.source, candidate.fuzzy, candidate.penalty).ifPresent(scores -> {
                    // We don't need to check haveChanceToAdd here because that
                    // check is implicit in the result of scoreEntry.
                    NearString toAdd = new NearString(candidate.key, candidate.source, candidate.translation,
                            candidate.comesFrom, candidate.fuzzy, candidate.tmxName, candidate.creator,
                            candidate.creationDate, candidate.changer, candidate.changedDate, candidate.props, scores,
                            null);
                    //System.out.println(toAdd + " (penalty: " + candidate.penalty + ")");
                    addNearString(result, toAdd);
                });
                accumulating.addAndGet(System.currentTimeMillis() - start);
            };
        }

        @Override
        public BinaryOperator<List<NearString>> combiner() {
            return (left, right) -> {
                long start = System.currentTimeMillis();
                for (NearString n : right) {
                    if (haveChanceToAdd(left, n.scores[0])) {
                        addNearString(left, n);
                    }
                }
                combining.addAndGet(System.currentTimeMillis() - start);
                return left;
            };
        }

        @Override
        public Function<List<NearString>, List<NearString>> finisher() {
            return Function.identity();
        }

        @Override
        public Set<java.util.stream.Collector.Characteristics> characteristics() {
            return EnumSet.of(Characteristics.IDENTITY_FINISH, Characteristics.UNORDERED);
        }

    }

    /**
     * Compare one entry with original entry.
     * 
     * @param candEntry
     *            entry to compare
     */
    protected Optional<NearString.Scores> scoreEntry(List<NearString> result, String source, boolean fuzzy,
            int penalty) {
        long start = System.currentTimeMillis();
        // remove part that is to be removed prior to tokenize
        String realSource = source;
        int realPenaltyForRemoved = 0;
        if (removePattern != null) {
            StringBuilder entryRemovedText = new StringBuilder();
            Matcher removeMatcher = removePattern.matcher(realSource);
            while (removeMatcher.find()) {
                entryRemovedText.append(removeMatcher.group());
            }
            realSource = removeMatcher.replaceAll("");
            // calculate penalty if something has been removed, otherwise different strings get 100% match.
            if (!entryRemovedText.toString().equals(removedText)) {
                // penalty for different 'removed'-part
                realPenaltyForRemoved = PENALTY_FOR_REMOVED;
            }
        }

        Token[] candTokens = tokenizeStem(realSource);

        ISimilarityCalculator localDistance = distance.get();

        // First percent value - with stemming if possible
        long simStart = System.currentTimeMillis();
        int similarityStem = FuzzyMatcher.calcSimilarity(localDistance, strTokensStem, candTokens);
        similarity.addAndGet(System.currentTimeMillis() - simStart);

        similarityStem -= penalty;
        if (fuzzy) {
            // penalty for fuzzy
            similarityStem -= PENALTY_FOR_FUZZY;
        }
        similarityStem -= realPenaltyForRemoved;

        // check if we have chance by first percentage only
        if (!haveChanceToAdd(result, similarityStem, Integer.MAX_VALUE, Integer.MAX_VALUE)) {
            scoring.addAndGet(System.currentTimeMillis() - start);
            return Optional.empty();
        }

        Token[] candTokensNoStem = tokenizeNoStem(realSource);
        // Second percent value - without stemming
        simStart = System.currentTimeMillis();
        int similarityNoStem = FuzzyMatcher.calcSimilarity(localDistance, strTokensNoStem, candTokensNoStem);
        similarity.addAndGet(System.currentTimeMillis() - simStart);

        similarityNoStem -= penalty;
        if (fuzzy) {
            // penalty for fuzzy
            similarityNoStem -= PENALTY_FOR_FUZZY;
        }
        similarityNoStem -= realPenaltyForRemoved;

        // check if we have chance by first and second percentages
        if (!haveChanceToAdd(result, similarityStem, similarityNoStem, Integer.MAX_VALUE)) {
            scoring.addAndGet(System.currentTimeMillis() - start);
            return Optional.empty();
        }

        Token[] candTokensAll = tokenizeAll(realSource);
        // Third percent value - with numbers, tags, etc.
        simStart = System.currentTimeMillis();
        int simAdjusted = FuzzyMatcher.calcSimilarity(localDistance, strTokensAll, candTokensAll);
        similarity.addAndGet(System.currentTimeMillis() - simStart);

        simAdjusted -= penalty;
        if (fuzzy) {
            // penalty for fuzzy
            simAdjusted -= PENALTY_FOR_FUZZY;
        }
        simAdjusted -= realPenaltyForRemoved;

        // check if we have chance by first, second and third percentages
        if (!haveChanceToAdd(result, similarityStem, similarityNoStem, simAdjusted)) {
            return Optional.empty();
        }
        scoring.addAndGet(System.currentTimeMillis() - start);

        return Optional.of(new NearString.Scores(similarityStem, similarityNoStem, simAdjusted));
    }

    protected boolean haveChanceToAdd(List<NearString> result, NearString.Scores scores) {
        return haveChanceToAdd(result, scores.score, scores.scoreNoStem, scores.adjustedScore);
    }

    /**
     * Check if entry have a chance to be added to result list. If no, there is no sense to calculate other
     * parameters.
     * 
     * @param simStem
     *            similarity with stemming
     * @param simNoStem
     *            similarity without stemming
     * @param simExactly
     *            exactly similarity
     * @return true if we have chance
     */
    protected boolean haveChanceToAdd(List<NearString> result, int simStem, int simNoStem, int simExactly) {
        if (simStem < OConsts.FUZZY_MATCH_THRESHOLD && simNoStem < OConsts.FUZZY_MATCH_THRESHOLD) {
            return false;
        }
        if (result.size() < maxCount) {
            return true;
        }
        NearString st = result.get(result.size() - 1);
        int chance = checkScore(st.scores[0].score, simStem);
        if (chance == 0) {
            chance = checkScore(st.scores[0].scoreNoStem, simNoStem);
        }
        if (chance == 0) {
            chance = checkScore(st.scores[0].adjustedScore, simExactly);
        }
        return chance != 1;
    }

    protected static int checkScore(final int storedScore, final int checkedStore) {
        return storedScore < checkedStore ? -1
                : storedScore > checkedStore ? 1 : 0;
    }

    /**
     * Add near string into result list. Near strings sorted by "similarity,simAdjusted"
     */
    protected void addNearString(List<NearString> result, NearString toAdd) {
        // find position for new data
        int pos = 0;
        for (int i = 0; i < result.size(); i++) {
            NearString st = result.get(i);
            if (canMerge(st, toAdd)) {
                // Consolidate identical matches from different sources into a single NearString with
                // multiple project entries.
                result.set(i, NearString.merge(st, toAdd));
                return;
            }
            if (st.scores[0].score < toAdd.scores[0].score) {
                break;
            }
            if (st.scores[0].score == toAdd.scores[0].score) {
                if (st.scores[0].scoreNoStem < toAdd.scores[0].scoreNoStem) {
                    break;
                }
                if (st.scores[0].scoreNoStem == toAdd.scores[0].scoreNoStem) {
                    if (st.scores[0].adjustedScore < toAdd.scores[0].adjustedScore) {
                        break;
                    }
                    // Patch contributed by Antonio Vilei
                    String entrySource = srcText;
                    // text with the same case has precedence
                    if (toAdd.scores[0].score == 100 && !st.source.equals(entrySource)
                            && toAdd.source.equals(entrySource)) {
                        break;
                    }
                }
            }
            pos = i + 1;
        }

        result.add(pos, toAdd);
        if (result.size() > maxCount) {
            result.remove(result.size() - 1);
        }
    }

    protected static boolean canMerge(NearString ns1, NearString ns2) {
        return ns1.source.equals(ns2.source)
                && (ns1.translation == ns2.translation || ns1.translation.equals(ns2.translation));
    }

    /*
     * Methods for tokenize strings with caching.
     */
    final ThreadLocal<Map<String, Token[]>> tokenizeStemCache = ThreadLocal.withInitial(HashMap::new);
    final ThreadLocal<Map<String, Token[]>> tokenizeNoStemCache = ThreadLocal.withInitial(HashMap::new);
    final ThreadLocal<Map<String, Token[]>> tokenizeAllCache = ThreadLocal.withInitial(HashMap::new);

    public Token[] tokenizeStem(String str) {
        long start = System.currentTimeMillis();
        Map<String, Token[]> cache = tokenizeStemCache.get();
        Token[] result = cache.get(str);
        if (result == null) {
            tokCacheMisses.incrementAndGet();
            result = tok.tokenizeWords(str, ITokenizer.StemmingMode.MATCHING);
            cache.put(str, result);
        } else {
            tokCacheHits.incrementAndGet();
        }
        tokenizing.addAndGet(System.currentTimeMillis() - start);
        return result;
    }

    public Token[] tokenizeNoStem(String str) {
        long start = System.currentTimeMillis();
        // No-stemming token comparisons are intentionally case-insensitive
        // for matching purposes.
        str = str.toLowerCase(srcLocale);
        Map<String, Token[]> cache = tokenizeNoStemCache.get();
        Token[] result = cache.get(str);
        if (result == null) {
            tokCacheMisses.incrementAndGet();

            result = tok.tokenizeWords(str, ITokenizer.StemmingMode.NONE);
            cache.put(str, result);
        } else {
            tokCacheHits.incrementAndGet();
        }
        tokenizing.addAndGet(System.currentTimeMillis() - start);
        return result;
    }

    public Token[] tokenizeAll(String str) {
        long start = System.currentTimeMillis();
        // Verbatim token comparisons are intentionally case-insensitive.
        // for matching purposes.
        str = str.toLowerCase(srcLocale);
        Map<String, Token[]> cache = tokenizeAllCache.get();
        Token[] result = cache.get(str);
        if (result == null) {
            tokCacheMisses.incrementAndGet();
            result = tok.tokenizeVerbatim(str);
            cache.put(str, result);
        } else {
            tokCacheHits.incrementAndGet();
        }
        tokenizing.addAndGet(System.currentTimeMillis() - start);
        return result;
    }

    protected void checkStopped(IStopped stop) throws StoppedException {
        if (stop.isStopped()) {
            throw new StoppedException();
        }
    }

    /**
     * Process will throw this exception if it stopped.All callers must catch it and just skip.
     */
    @SuppressWarnings("serial")
    public static class StoppedException extends RuntimeException {
    }
}
