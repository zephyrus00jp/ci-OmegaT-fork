/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
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
