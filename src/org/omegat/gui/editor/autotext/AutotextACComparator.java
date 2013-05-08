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

import java.util.Comparator;

/**
 *
 * @author bartkoz
 */
public class AutotextACComparator implements Comparator<AutotextPair> {

    private boolean byLength;
    private boolean alphabetically;
    private boolean excludeAbbreviations;
    
    public AutotextACComparator (boolean sortByLength, boolean sortAlphabetically, boolean excludeAbbreviations) {
        byLength = sortByLength;
        alphabetically = sortAlphabetically;
        this.excludeAbbreviations = excludeAbbreviations;
    }
    
    @Override
    public int compare(AutotextPair o1, AutotextPair o2) {
        if (byLength) {
            if (o1.target.length() < o2.target.length()) {
                return 1;
            } else if (o1.target.length() > o2.target.length()) {
                return -1;
            }
        }
        
        if (alphabetically) {
            if (excludeAbbreviations)
                return o1.target.compareTo(o2.target);
            else
                return o1.toString().compareTo(o2.toString());
        }
        
        return 0;
    }
    
}
