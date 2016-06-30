/**************************************************************************
 OmegaT - Computer Assisted Translation (CAT) tool 
          with fuzzy matching, translation memory, keyword search, 
          glossaries, and translation leveraging into updated projects.

 Copyright (C) 2000-2006 Keith Godfrey and Maxym Mykhalchuk
               2009 Alex Buloichik
               2012 Thomas Cordonnier
               2013-2014 Aaron Madlon-Kay
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

package org.omegat.core.matching;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;

import org.omegat.core.data.EntryKey;
import org.omegat.util.Preferences;
import org.omegat.util.TMXProp;

/**
 * Class to hold a single fuzzy match.
 * 
 * @author Keith Godfrey
 * @author Maxym Mykhalchuk
 * @author Thomas Cordonnier
 * @author Aaron Madlon-Kay
 */
public class NearString {
    public enum MATCH_SOURCE {
        MEMORY, TM, FILES
    };
    
    public enum SORT_KEY {
        SCORE, SCORE_NO_STEM, ADJUSTED_SCORE
    }

    public NearString(EntryKey key, String source, String translation, MATCH_SOURCE comesFrom, boolean fuzzyMark,
            String projName, String creator, long creationDate, String changer, long changedDate, List<TMXProp> props,
            Scores scores, byte[] nearData) {
        this.key = key;
        this.source = source;
        this.translation = translation;
        this.comesFrom = comesFrom;
        this.fuzzyMark = fuzzyMark;
        this.projs = new String[] { projName == null ? "" : projName };
        this.props = props;
        this.creator = creator;
        this.creationDate = creationDate;
        this.changer = changer;
        this.changedDate = changedDate;
        this.scores = new Scores[] { scores };
        this.attr = nearData;
    }
    
    public static NearString merge(NearString ns1, NearString ns2) {

        List<String> projs = new ArrayList<>();
        projs.addAll(Arrays.asList(ns1.projs));
        projs.addAll(Arrays.asList(ns2.projs));
        Collections.sort(projs);
        
        List<Scores> scores = new ArrayList<>();
        scores.addAll(Arrays.asList(ns1.scores));
        scores.addAll(Arrays.asList(ns2.scores));
        Collections.sort(scores, new ScoresComparator());
        
        NearString base = ns2.scores[0].score > ns1.scores[0].score ? ns2 : ns1;
        NearString merged = new NearString(base.key, base.source, base.translation, base.comesFrom, base.fuzzyMark,
                null, base.creator, base.creationDate, base.changer, base.changedDate, base.props, null, base.attr);
        merged.projs = projs.toArray(new String[projs.size()]);
        merged.scores = scores.toArray(new Scores[scores.size()]);
        return merged;
    }

    final public EntryKey key;
    final public String source;
    final public String translation;
    final public MATCH_SOURCE comesFrom;
    
    final public boolean fuzzyMark;

    public Scores[] scores;

    /** matching attributes of near strEntry */
    public byte[] attr;
    public String[] projs;
    final public List<TMXProp> props;
    final public String creator;
    final public long creationDate;
    final public String changer;
    final public long changedDate;

    public static class Scores {
        public final int score;
        /** similarity score for match without non-word tokens */
        public final int scoreNoStem;
        /** adjusted similarity score for match including all tokens */
        public final int adjustedScore;
        
        public Scores(int score, int scoreNoStem, int adjustedScore) {
            this.score = score;
            this.scoreNoStem = scoreNoStem;
            this.adjustedScore = adjustedScore;
        }
        
        public String toString() {
            StringBuilder b = new StringBuilder();
            b.append("(").append(score).append("/");
            b.append(scoreNoStem).append("/");
            b.append(adjustedScore).append("%)");
            return b.toString();
        }
    }
    
    public static class ScoresComparator implements Comparator<Scores> {
        
        private final SORT_KEY key;
        
        public ScoresComparator() {
            this(Preferences.getPreferenceEnumDefault(Preferences.EXT_TMX_SORT_KEY, SORT_KEY.SCORE));
        }
        
        public ScoresComparator(SORT_KEY key) {
            this.key = key;
        }
        
        @Override
        public int compare(Scores o1, Scores o2) {
            int s1 = primaryScore(o1);
            int s2 = primaryScore(o2);
            if (s1 != s2) {
                return s1 > s2 ? 1 : -1;
            }
            s1 = secondaryScore(o1);
            s2 = secondaryScore(o2);
            if (s1 != s2) {
                return s1 > s2 ? 1 : -1;
            }
            s1 = ternaryScore(o1);
            s2 = ternaryScore(o2);
            if (s1 != s2) {
                return s1 > s2 ? 1 : -1;
            }
            return 0;
        }
        
        private int primaryScore(Scores s) {
            switch(key) {
            case SCORE:
                return s.score;
            case SCORE_NO_STEM:
                return s.scoreNoStem;
            case ADJUSTED_SCORE:
            default:
                return s.adjustedScore;
            }
        }
        
        private int secondaryScore(Scores s) {
            switch(key) {
            case SCORE:
                return s.scoreNoStem;
            case SCORE_NO_STEM:
                return s.score;
            case ADJUSTED_SCORE:
            default:
                return s.score;
            }
        }
        
        private int ternaryScore(Scores s) {
            switch(key) {
            case SCORE:
                return s.adjustedScore;
            case SCORE_NO_STEM:
                return s.adjustedScore;
            case ADJUSTED_SCORE:
            default:
                return s.scoreNoStem;
            }
        }
    }
    
    public static class NearStringComparator implements Comparator<NearString> {
        
        private final SORT_KEY key;
        private final ScoresComparator c;
        
        public NearStringComparator() {
            this.key = Preferences.getPreferenceEnumDefault(Preferences.EXT_TMX_SORT_KEY, SORT_KEY.SCORE);
            this.c = new ScoresComparator(key);
        }
        
        public NearStringComparator(SORT_KEY key) {
            this.key = key;
            this.c = new ScoresComparator(key);
        }
        
        @Override
        public int compare(NearString o1, NearString o2) {
            return c.compare(o1.scores[0], o2.scores[0]);
        }
    }

    @Override
    public String toString() {
        return String.join(" ", source.substring(0, source.offsetByCodePoints(0, Math.min(20, source.length()))),
                scores[0].toString(), "x" + scores.length);
    }
}
