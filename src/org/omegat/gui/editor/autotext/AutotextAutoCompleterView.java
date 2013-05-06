/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
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
