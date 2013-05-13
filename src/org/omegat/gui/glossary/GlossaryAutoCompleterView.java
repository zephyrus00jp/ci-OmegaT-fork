/**************************************************************************
 OmegaT - Computer Assisted Translation (CAT) tool 
          with fuzzy matching, translation memory, keyword search, 
          glossaries, and translation leveraging into updated projects.

 Copyright (C) 2013 Zoltan Bartko, Aaron Madlon-Kay
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

package org.omegat.gui.glossary;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import org.omegat.core.Core;
import org.omegat.gui.editor.autocompleter.AutoCompleter;
import org.omegat.gui.editor.autocompleter.AutoCompleterView;
import org.omegat.util.OStrings;
import org.omegat.util.Preferences;

/**
 * The glossary auto-completer view.
 * 
 * @author Zoltan Bartko <bartkozoltan@bartkozoltan.com>
 * @author Aaron Madlon-Kay
 */
public class GlossaryAutoCompleterView extends AutoCompleterView {

    public GlossaryAutoCompleterView(AutoCompleter completer) {
        super(OStrings.getString("AC_GLOSSARY_VIEW"), completer);
    }

    @Override
    public List<String> computeListData(String wordChunk) {
        List<GlossaryACPair> entryList = new ArrayList<GlossaryACPair>();
        List<String> result = new ArrayList<String>();
        setSeparator(Preferences.getPreference(Preferences.AC_GLOSSARY_SEPARATOR));
        boolean targetFirst = Preferences.isPreference(Preferences.AC_GLOSSARY_SHOW_TARGET_BEFORE_SOURCE);
        
        for (GlossaryEntry entry : Core.getGlossary().getDisplayedEntries()) {
            for (String s : entry.getLocTerms(true)) {
                if (s.toLowerCase().startsWith(wordChunk.toLowerCase())) {
                    entryList.add(new GlossaryACPair(entry.getSrcText(),s));
                }
            }
        }
        
        if (!Core.getProject().getProjectProperties().getTargetLanguage().isSpaceDelimited()
                && entryList.size() == 0) {
            for (GlossaryEntry entry : Core.getGlossary().getDisplayedEntries()) {
                for (String s : entry.getLocTerms(true)) {
                    entryList.add(new GlossaryACPair(entry.getSrcText(),s));
                }
            }
            completer.adjustInsertionPoint(wordChunk.length());
        }
        
        GlossaryACComparator acComparator = new GlossaryACComparator(
                Preferences.isPreference(Preferences.AC_GLOSSARY_SORT_BY_LENGTH),
                Preferences.isPreference(Preferences.AC_GLOSSARY_SORT_ALPHABETICALLY),
                Preferences.isPreference(Preferences.AC_GLOSSARY_SORT_BY_SOURCE));
        Collections.sort(entryList, acComparator);
        
        if (!Preferences.isPreference(Preferences.AC_GLOSSARY_SHOW_SOURCE)) {
            for (GlossaryACPair pair:entryList) {
                result.add(pair.target);
            }
        } else {
            for (GlossaryACPair pair:entryList) {
                if (targetFirst) {
                    result.add(pair.target + getSeparator() + pair.source);
                } else {
                    result.add(pair.source + getSeparator() + pair.target);
                }
            }
        }
        
        return result;
    }   

    @Override
    public String stripSource(String input, int separatorPosition) {
        if (!Preferences.isPreference(Preferences.AC_GLOSSARY_SHOW_TARGET_BEFORE_SOURCE)) {
            return input.substring(separatorPosition+getSeparator().length());
        } else {
            return input.substring(0, separatorPosition);
        }
    }
    
    
}
