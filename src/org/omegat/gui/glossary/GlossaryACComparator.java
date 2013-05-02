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
package org.omegat.gui.glossary;

import java.util.Comparator;

/**
 * A comparator for glossary entries
 * @author bartkoz
 */
public class GlossaryACComparator implements Comparator<GlossaryACPair> {

    private boolean byLength;
    private boolean alphabetically;
    private boolean bySource;
    
    public GlossaryACComparator(boolean sortByLength, boolean sortAlphabetically, boolean sortBySource) {
        byLength = sortByLength;
        alphabetically = sortAlphabetically;
        bySource = sortBySource;
    }
    
    @Override
    public int compare(GlossaryACPair o1, GlossaryACPair o2) {
        if (bySource) {
            int result = o1.source.compareTo(o2.source);
            if (result != 0)
                return result;
        }
        
        if (byLength) {
            if (o1.target.length() < o2.target.length()) {
                return 1;
            } else if (o1.target.length() > o2.target.length()) {
                return -1;
            }
        }
        if (alphabetically)
            return o1.target.compareTo(o2.target);
        
        return 0;
    }
    
}
