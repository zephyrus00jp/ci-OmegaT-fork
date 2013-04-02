/**************************************************************************
 OmegaT - Computer Assisted Translation (CAT) tool 
          with fuzzy matching, translation memory, keyword search, 
          glossaries, and translation leveraging into updated projects.

 Copyright (C) 2013 Zoltan Bartko (bartkozoltan@bartkozoltan.com)
               Home page: http://www.omegat.org/
               Support center: http://groups.yahoo.com/group/OmegaT/

 This program is free software; you can redistribute it and/or modify
 it under the terms of the GNU General Public License as published by
 the Free Software Foundation; either version 2 of the License, or
 (at your option) any later version.

 This program is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU General Public License for more details.

 You should have received a copy of the GNU General Public License
 along with this program; if not, write to the Free Software
 Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA
 **************************************************************************/

package org.omegat.core.matching;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.net.URL;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;
import org.omegat.util.OConsts;
import org.omegat.util.Preferences;
import org.omegat.util.StaticUtils;

/**
 * A map of stop words.
 * 
 * @author Zoltan Bartko
 */
public class StopWords {
    
    Map<Pattern,List<String>> wordBase = new HashMap<Pattern,List<String>>(); 
    
    public StopWords() {
        doLoad(StaticUtils.getConfigDir() + Preferences.STOPWORD_PREFERENCES);
    }
    
    /**
     * Process a single line when reading from the file
     * @param toProcess the string to process
     */
    private void processLine(String toProcess) {
        int start = 0;
        int end;
        List<String> stopWords = new ArrayList<String>(64);
        
        end = toProcess.indexOf(':');
        if (end == -1) {
            return;
        }
        
        String language = toProcess.substring(start, end);
        start = end + 1;
        while (start < toProcess.length()) {
            end = toProcess.indexOf(';', start);
            if (end == -1) {
                break;
            }
            stopWords.add(toProcess.substring(start,end).trim());
            start = end + 1;
        }
        if (stopWords.size() > 0) {
            wordBase.put(Pattern.compile(language), stopWords);
        }
    }
    
    /**
     * Load the stop word file from the disk
     * @param fileName the file name to use
     */
    public void doLoad(String fileName) {
        BufferedReader br = null;
        try {
            br = new BufferedReader(new InputStreamReader(new FileInputStream(
                    fileName), OConsts.UTF8));

            String thisLine;
            while ((thisLine = br.readLine()) != null) {
                processLine(thisLine);
            }
        } catch (FileNotFoundException ex) {
            // load the default
            URL stopWordFileUrl = this.getClass().getResource(Preferences.STOPWORD_PREFERENCES);
            doLoad(stopWordFileUrl.getFile());
        } catch (IOException ex) {
            // so now what?
        } finally {
            try {
                if (br != null)
                    br.close();
            } catch (IOException ex) {
                // so now what?
            }
        }
    }
    
    /**
     * Save the stop word file
     * @throws IOException 
     */
    public void doSave()  throws IOException {
        BufferedWriter out = new BufferedWriter(new OutputStreamWriter(new FileOutputStream(
                StaticUtils.getConfigDir() + Preferences.STOPWORD_PREFERENCES), OConsts.UTF8));

        for (Map.Entry<Pattern,List<String>> entry : wordBase.entrySet()){    
            out.write(entry.getKey().pattern() + ":");
            for (String stopWord:entry.getValue()) {
                out.write(" "+stopWord+";");
            }
            out.write("\n");
        }
        out.close();
    }
    
    /**
     * Get a list of stop words for the language, merging all lists that match 
     * the language
     * @param language the language to find stop words for
     * @return aggregated stop word list
     */
    public List<String> getStopWordList(String language) {
        List<String> stopWords = new ArrayList<String>(100);
        for (Map.Entry<Pattern,List<String>> entry : wordBase.entrySet()){    
            if (entry.getKey().matcher(language).matches()) {
                stopWords.addAll(entry.getValue());
            }
        }
        
        if (stopWords.isEmpty())
            return null;
        else
            return stopWords;
    }
    
    /**
     * Returns the stop word base for further action.
     * @return the stop word base.
     */
    public Map<Pattern,List<String>> getStopWordBase() {
        return wordBase;
    }
}
