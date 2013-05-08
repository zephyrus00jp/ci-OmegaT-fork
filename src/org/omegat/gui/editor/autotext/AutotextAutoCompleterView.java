/**************************************************************************
 OmegaT - Computer Assisted Translation (CAT) tool 
          with fuzzy matching, translation memory, keyword search, 
          glossaries, and translation leveraging into updated projects.

 Copyright (C) 2013 Zoltan Bartko
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

package org.omegat.gui.editor.autotext;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import org.omegat.core.Core;
import org.omegat.gui.editor.autocompleter.AutoCompleter;
import org.omegat.gui.editor.autocompleter.AutoCompleterView;
import org.omegat.util.OStrings;
import org.omegat.util.Preferences;

/**
 *
 * @author bartkoz
 */
public class AutotextAutoCompleterView extends AutoCompleterView {

    public AutotextAutoCompleterView(AutoCompleter completer) {
        super(OStrings.getString("AC_AUTOTEXT_VIEW"), completer);
    }
    
    @Override
    public String getSeparator() {
        return Core.getAutoText().getSeparator();
    }
            
    @Override
    public List<String> computeListData(String wordChunk) {
        List<String> result = new ArrayList<String>();
        List<AutotextPair> entryList = new ArrayList<AutotextPair>();
        String candidate;
        for (AutotextPair s : Core.getAutoText().getList()) {
            
            if (s.source != null) {
                candidate = s.source;
            } else {
                candidate = s.target;
            }
            if (candidate.toLowerCase().startsWith(wordChunk.toLowerCase())) {
                entryList.add(s);
            }
        }
        
        AutotextACComparator acComparator = new AutotextACComparator(
                Preferences.isPreference(Preferences.AC_AUTOTEXT_SORT_BY_LENGTH),
                Preferences.isPreference(Preferences.AC_AUTOTEXT_SORT_ALPHABETICALLY),
                Preferences.isPreference(Preferences.AC_AUTOTEXT_EXCLUDE_ABBREVS));
        
        Collections.sort(entryList, acComparator);
        
        for (AutotextPair pair:entryList) {
            result.add(pair.toString());
        }
        return result;
    }
    
}
