/**************************************************************************
 OmegaT - Computer Assisted Translation (CAT) tool
          with fuzzy matching, translation memory, keyword search,
          glossaries, and translation leveraging into updated projects.

 Copyright (C) 2009 Alex Buloichik
               2010 Arno Peters
               2013-2014 Alex Buloichik
               2015 Aaron Madlon-Kay
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

import java.io.File;
import java.io.StringWriter;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.TimeZone;

import javax.xml.stream.XMLOutputFactory;
import javax.xml.stream.XMLStreamException;
import javax.xml.stream.XMLStreamWriter;

import org.omegat.core.Core;
import org.omegat.core.data.IProject;
import org.omegat.core.data.IProject.FileInfo;
import org.omegat.core.data.ProjectProperties;
import org.omegat.core.data.ProtectedPart;
import org.omegat.core.data.SourceTextEntry;
import org.omegat.core.data.TMXEntry;
import org.omegat.core.threads.LongProcessThread;
import org.omegat.gui.stat.StatisticsPanel;
import org.omegat.util.OConsts;
import org.omegat.util.OStrings;
import org.omegat.util.StaticUtils;
import org.omegat.util.gui.TextUtil;

/**
 * Thread for calculate standard statistics.
 *
 * Calculation requires two different tags stripping: one for calculate unique and remaining, and second for
 * calculate number of words and chars.
 *
 * Number of words/chars calculation requires to just strip all tags, protected parts, placeholders(see StatCount.java).
 *
 * Calculation of unique and remaining also requires to just strip all tags, protected parts, placeholders for
 * standard calculation.
 *
 * @author Alex Buloichik (alex73mail@gmail.com)
 * @author Arno Peters
 * @author Aaron Madlon-Kay
 */
public class CalcStandardStatistics extends LongProcessThread {
    private static final String[] HT_HEADERS = { "", OStrings.getString("CT_STATS_Segments"),
            OStrings.getString("CT_STATS_Words"), OStrings.getString("CT_STATS_Characters_NOSP"),
            OStrings.getString("CT_STATS_Characters"), OStrings.getString("CT_STATS_Files") };

    private static final String[] HT_ROWS = { OStrings.getString("CT_STATS_Total"),
            OStrings.getString("CT_STATS_Remaining"), OStrings.getString("CT_STATS_Unique"),
            OStrings.getString("CT_STATS_Unique_Remaining") };
    private static final boolean[] HT_ALIGN = new boolean[] { false, true, true, true, true, true };

    private static final String[] FT_HEADERS = { OStrings.getString("CT_STATS_FILE_Name"),
            OStrings.getString("CT_STATS_FILE_Total_Segments"),
            OStrings.getString("CT_STATS_FILE_Remaining_Segments"),
            OStrings.getString("CT_STATS_FILE_Unique_Segments"),
            OStrings.getString("CT_STATS_FILE_Unique_Remaining_Segments"),
            OStrings.getString("CT_STATS_FILE_Total_Words"),
            OStrings.getString("CT_STATS_FILE_Remaining_Words"),
            OStrings.getString("CT_STATS_FILE_Unique_Words"),
            OStrings.getString("CT_STATS_FILE_Unique_Remaining_Words"),
            OStrings.getString("CT_STATS_FILE_Total_Characters_NOSP"),
            OStrings.getString("CT_STATS_FILE_Remaining_Characters_NOSP"),
            OStrings.getString("CT_STATS_FILE_Unique_Characters_NOSP"),
            OStrings.getString("CT_STATS_FILE_Unique_Remaining_Characters_NOSP"),
            OStrings.getString("CT_STATS_FILE_Total_Characters"),
            OStrings.getString("CT_STATS_FILE_Remaining_Characters"),
            OStrings.getString("CT_STATS_FILE_Unique_Characters"),
            OStrings.getString("CT_STATS_FILE_Unique_Remaining_Characters"), };

    private static final boolean[] FT_ALIGN = { false, true, true, true, true, true, true, true,
            true, true, true, true, true, true, true, true, true, };

    private final StatisticsPanel callback;
    
    public static enum StatOutputMode { TEXT, XML };
    
    public static StatOutputMode outputMode = StatOutputMode.TEXT;

    public CalcStandardStatistics(StatisticsPanel callback) {
        this.callback = callback;
    }

    @Override
    public void run() {
        IProject p = Core.getProject();
        String result = buildProjectStats(p, null, callback);
        callback.setTextData(result);
        callback.finishData();

        String internalDir = p.getProjectProperties().getProjectInternal();
        // removing old stats
        try {
            File oldstats = new File(internalDir + "word_counts");
            if (oldstats.exists()) {
                oldstats.delete();
            }
        } catch (Exception e) {
        }

        // now dump file based word counts to disk
        String fn = internalDir + OConsts.STATS_FILENAME;
        Statistics.writeStat(fn, result);
        callback.setDataFile(fn);
    }

    /** Convenience method */
    public static String buildProjectStats(final IProject project, final StatisticsInfo hotStat) {
        return buildProjectStats(project, hotStat, null);
    }

    /**
     * Builds a file with statistic info about the project. The total word &
     * character count of the project, the total number of unique segments, plus
     * the details for each file.
     */
    public static String buildProjectStats(final IProject project, final StatisticsInfo hotStat,
            final StatisticsPanel callback) {

        ProjectStats projectStats = new ProjectStats(project); 

        // find unique segments
        Map<String, SourceTextEntry> uniqueSegment = new HashMap<String, SourceTextEntry>();
        Set<String> translated = new HashSet<String>();
        for (SourceTextEntry ste : project.getAllEntries()) {
            String src = ste.getSrcText();
            for (ProtectedPart pp : ste.getProtectedParts()) {
                src = src.replace(pp.getTextInSourceSegment(), pp.getReplacementUniquenessCalculation());
            }
            if (!uniqueSegment.containsKey(src)) {
                uniqueSegment.put(src, ste);
            }
            TMXEntry tr = project.getTranslationInfo(ste);
            if (tr.isTranslated()) {
                translated.add(src);
            }
        }
        Set<String> filesUnique = new HashSet<String>();
        Set<String> filesRemainingUnique = new HashSet<String>();
        for (Map.Entry<String, SourceTextEntry> en : uniqueSegment.entrySet()) {
            /* Number of words and chars calculated without all tags and protected parts. */
            StatCount count = new StatCount(en.getValue());

            // add to unique
            projectStats.unique.add(count);
            filesUnique.add(en.getValue().getKey().file);
            // add to unique remaining
            if (!translated.contains(en.getKey())) {
                projectStats.remainingUnique.add(count);
                filesRemainingUnique.add(en.getValue().getKey().file);
            }
        }
        projectStats.unique.addFiles(filesUnique.size());
        projectStats.remainingUnique.addFiles(filesRemainingUnique.size());

        //List<FileData> counts = new ArrayList<FileData>();
        Map<String, Boolean> firstSeenUniqueSegment = new HashMap<String, Boolean>();
        for (FileInfo file : project.getProjectFiles()) {
            FileData numbers = new FileData();
            numbers.filename = file.filePath;
            projectStats.files.add(numbers);
            int fileTotal = 0;
            int fileRemaining = 0;
            for (SourceTextEntry ste : file.entries) {
                String src = ste.getSrcText();
                for (ProtectedPart pp : ste.getProtectedParts()) {
                    src = src.replace(pp.getTextInSourceSegment(), pp.getReplacementUniquenessCalculation());
                }

                /* Number of words and chars calculated without all tags and protected parts. */
                StatCount count = new StatCount(ste);

                // add to total
                projectStats.total.add(count);
                fileTotal = 1;

                // add to remaining
                TMXEntry tr = project.getTranslationInfo(ste);
                if (!tr.isTranslated()) {
                    projectStats.remaining.add(count);
                    fileRemaining = 1;
                }

                // add to file's info
                numbers.total.add(count);

                Boolean firstSeen = firstSeenUniqueSegment.get(src);
                if (firstSeen == null) {
                    firstSeenUniqueSegment.put(src, false);
                    numbers.unique.add(count);

                    if (!tr.isTranslated()) {
                        numbers.remainingUnique.add(count);
                    }
                }

                if (!tr.isTranslated()) {
                    numbers.remaining.add(count);
                }
            }
            projectStats.total.addFiles(fileTotal);
            projectStats.remaining.addFiles(fileRemaining);
        }

        if (hotStat != null) {
            hotStat.numberOfSegmentsTotal = projectStats.total.segments;
            hotStat.numberofTranslatedSegments = translated.size();
            hotStat.numberOfUniqueSegments = projectStats.unique.segments;
            hotStat.uniqueCountsByFile.clear();
            for (FileData fd : projectStats.files) {
                hotStat.uniqueCountsByFile.put(fd.filename, fd.unique.segments);
            }
        }

        if (outputMode == StatOutputMode.XML) {
            try {
                return getXmlResults(projectStats, callback);
            } catch (XMLStreamException e) {
                e.printStackTrace();
                return null;
            }
        } else {
            return getTextResults(projectStats, callback);
        }
    }

    private static String getXmlResults(ProjectStats stats, StatisticsPanel callback) throws XMLStreamException {

        StringWriter result = new StringWriter();
        SimpleDateFormat dateFormat = new SimpleDateFormat("yyyyMMdd'T'HHmmss'Z'", Locale.ENGLISH);
        dateFormat.setTimeZone(TimeZone.getTimeZone("UTC"));
        XMLStreamWriter xml = XMLOutputFactory.newInstance().createXMLStreamWriter(result);

        xml.writeStartDocument(StandardCharsets.UTF_8.name(), "1.0");
        xml.writeCharacters(System.lineSeparator());

        xml.writeStartElement("omegat-stats");
        xml.writeAttribute("date", dateFormat.format(new Date()));
        xml.writeCharacters(System.lineSeparator());

        xml.writeStartElement("project");
        ProjectProperties props = stats.project.getProjectProperties();
        xml.writeAttribute("name", props.getProjectName());
        xml.writeAttribute("root", props.getProjectRoot());
        xml.writeAttribute("source", props.getSourceLanguage().toString());
        xml.writeAttribute("target", props.getTargetLanguage().toString());
        xml.writeCharacters(System.lineSeparator());

        // Header stats
        String[][] headerTable = calcHeaderTable(
                new StatCount[] { stats.total, stats.remaining, stats.unique, stats.remainingUnique });

        String[] headers = { "segments", "words", "characters-nosp", "characters" };
        String[] attrs = { "total", "remaining", "unique", "unique-remaining" };

        for (int h = 0; h < headers.length; h++) {
            xml.writeEmptyElement(headers[h]);

            for (int a = 1; a < attrs.length; a++) {
                xml.writeAttribute(attrs[a], headerTable[h][a]);
            }
            xml.writeCharacters(System.lineSeparator());
        }
        xml.writeEndElement();
        xml.writeCharacters(System.lineSeparator());

        // STATISTICS BY FILE
        xml.writeStartElement("files");
        xml.writeCharacters(System.lineSeparator());

        String[] fileAttrs = { "name", "total-segments", "remaining-segments", "unique-segments",
                "unique-remaining-segments", "total-words", "remaining-words", "unique-words", "unique-remaining-words",
                "total-characters-nosp", "remaining-characters-nosp", "unique-characters-nosp",
                "unique-remaining-characters-nosp", "total-characters", "remaining-characters", "unique-characters",
                "unique-remaining-characters" };

        String[][] filesTable = calcFilesTable(props, stats.files);
        for (int f = 0; f < filesTable.length; f++) {
            xml.writeStartElement("file");
            xml.writeAttribute(fileAttrs[0], filesTable[f][0]); // name
            xml.writeCharacters(System.lineSeparator());
            for (int h = 0; h < headers.length; h++) {
                xml.writeEmptyElement(headers[h]);

                for (int a = 0; a < attrs.length; a++) {
                    xml.writeAttribute(attrs[a], filesTable[f][1 + a + (h * attrs.length)]);
                }
                xml.writeCharacters(System.lineSeparator());
            }
            xml.writeEndElement();

            xml.writeCharacters(System.lineSeparator());
        }

        xml.writeEndElement();

        xml.writeEndElement();
        xml.writeEndDocument();
        xml.close();

        return result.toString();
    }

    private static String getTextResults(ProjectStats stats, StatisticsPanel callback) {
        StringBuilder result = new StringBuilder();

        result.append(OStrings.getString("CT_STATS_Project_Statistics"));
        result.append("\n\n");

        String[][] headerTable = calcHeaderTable(
                new StatCount[] { stats.total, stats.remaining, stats.unique, stats.remainingUnique });
        if (callback != null) {
            callback.setProjectTableData(HT_HEADERS, headerTable);
        }
        result.append(TextUtil.showTextTable(HT_HEADERS, headerTable, HT_ALIGN));
        result.append("\n\n");

        // STATISTICS BY FILE
        result.append(OStrings.getString("CT_STATS_FILE_Statistics"));
        result.append("\n\n");
        String[][] filesTable = calcFilesTable(stats.project.getProjectProperties(), stats.files);
        if (callback != null) {
            callback.setFilesTableData(FT_HEADERS, filesTable);
        }
        result.append(TextUtil.showTextTable(FT_HEADERS, filesTable, FT_ALIGN));

        return result.toString();
    }

    protected static String[][] calcHeaderTable(final StatCount[] result) {
        String[][] table = new String[result.length][6];

        for (int i = 0; i < result.length; i++) {
            table[i][0] = HT_ROWS[i];
            table[i][1] = Integer.toString(result[i].segments);
            table[i][2] = Integer.toString(result[i].words);
            table[i][3] = Integer.toString(result[i].charsWithoutSpaces);
            table[i][4] = Integer.toString(result[i].charsWithSpaces);
            table[i][5] = Integer.toString(result[i].files);
        }
        return table;
    }

    protected static String[][] calcFilesTable(final ProjectProperties config, final List<FileData> counts) {
        String[][] table = new String[counts.size()][17];

        int r = 0;
        for (FileData numbers : counts) {
            table[r][0] = StaticUtils.makeFilenameRelative(numbers.filename, config.getSourceRoot());
            table[r][1] = Integer.toString(numbers.total.segments);
            table[r][2] = Integer.toString(numbers.remaining.segments);
            table[r][3] = Integer.toString(numbers.unique.segments);
            table[r][4] = Integer.toString(numbers.remainingUnique.segments);
            table[r][5] = Integer.toString(numbers.total.words);
            table[r][6] = Integer.toString(numbers.remaining.words);
            table[r][7] = Integer.toString(numbers.unique.words);
            table[r][8] = Integer.toString(numbers.remainingUnique.words);
            table[r][9] = Integer.toString(numbers.total.charsWithoutSpaces);
            table[r][10] = Integer.toString(numbers.remaining.charsWithoutSpaces);
            table[r][11] = Integer.toString(numbers.unique.charsWithoutSpaces);
            table[r][12] = Integer.toString(numbers.remainingUnique.charsWithoutSpaces);
            table[r][13] = Integer.toString(numbers.total.charsWithSpaces);
            table[r][14] = Integer.toString(numbers.remaining.charsWithSpaces);
            table[r][15] = Integer.toString(numbers.unique.charsWithSpaces);
            table[r][16] = Integer.toString(numbers.remainingUnique.charsWithSpaces);
            r++;
        }
        return table;
    }

    public static class ProjectStats {
        public final IProject project;
        public final StatCount total, unique, remaining, remainingUnique;
        public final List<FileData> files = new ArrayList<>();

        public ProjectStats(IProject project) {
            this.project = project;
            total = new StatCount();
            unique = new StatCount();
            remaining = new StatCount();
            remainingUnique = new StatCount();
        }
    }

    public static class FileData {
        public String filename;
        public StatCount total, unique, remaining, remainingUnique;

        public FileData() {
            total = new StatCount();
            unique = new StatCount();
            remaining = new StatCount();
            remainingUnique = new StatCount();
        }
    }
}
