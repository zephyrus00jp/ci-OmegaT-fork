/**************************************************************************
 OmegaT - Computer Assisted Translation (CAT) tool 
          with fuzzy matching, translation memory, keyword search, 
          glossaries, and translation leveraging into updated projects.

 Copyright (C) 2016 Aaron Madlon-Kay
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

package org.omegat.gui.preferences.view;

import javax.swing.JComponent;

import org.omegat.gui.preferences.BasePreferencesController;
import org.omegat.gui.shortcuts.PropertiesShortcuts;
import org.omegat.util.OStrings;
import org.omegat.util.Preferences;

/**
 * @author Aaron Madlon-Kay
 */
public class SearchOptionsController extends BasePreferencesController {

    // See org/omegat/gui/main/MainMenuShortcuts.properties
    public static final String PROPERTY_KEY_SEARCH_REUSE = "findInProjectReuseLastWindow";
    
    private SearchOptionsPanel panel;

    @Override
    public JComponent getGui() {
        if (panel == null) {
            initGui();
            initFromPrefs();
        }
        return panel;
    }

    @Override
    public String toString() {
        return OStrings.getString("PREFS_TITLE_SEARCH");
    }

    private void initGui() {
        panel = new SearchOptionsPanel();
        panel.reuseSearchWindowCheckBox.addActionListener(e -> updateMessages());
    }

    private void updateMessages() {
        boolean isReuse = panel.reuseSearchWindowCheckBox.isSelected();
        String reuseMessage = null;
        try {
            String shortcut = PropertiesShortcuts.MainMenuShortcuts.getShortcutText(PROPERTY_KEY_SEARCH_REUSE);
            reuseMessage = isReuse ? OStrings.getString("PREFS_SEARCH_REUSE_ON_MESSAGE", shortcut)
                    : OStrings.getString("PREFS_SEARCH_REUSE_OFF_MESSAGE", shortcut);
        } catch (Exception ex) {
            // Keys are not defined.
            // User must have changed them, in which case skip guidance here.
        }
        panel.reuseSearchWindowMessageTextArea.setText(reuseMessage);
    }
    
    @Override
    protected void initFromPrefs() {
        panel.reuseSearchWindowCheckBox.setSelected(Preferences.isPreference(Preferences.SEARCHWINDOW_REUSE_EXISTING));
        updateMessages();
    }

    @Override
    public void restoreDefaults() {
        panel.reuseSearchWindowCheckBox.setSelected(false);
        updateMessages();
    }

    @Override
    public void persist() {
        Preferences.setPreference(Preferences.SEARCHWINDOW_REUSE_EXISTING, panel.reuseSearchWindowCheckBox.isSelected());
    }
}
