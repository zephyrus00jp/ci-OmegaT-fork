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

package org.omegat.gui.editor.autocompleter;

import java.util.List;

import org.omegat.core.Core;
import org.omegat.tokenizer.ITokenizer;
import org.omegat.util.OStrings;
import org.omegat.util.Preferences;

/**
 * A view of the auto-completer.
 * 
 * @author Zoltan Bartko <bartkozoltan@bartkozoltan.com>
 * @author Aaron Madlon-Kay
 */
public abstract class AutoCompleterView {
    /**
     * the name appearing in the auto-completer.
     */
    private String name;
    
    /**
     * the completer
     */
    protected AutoCompleter completer;
    
    /**
     * the separator string between source and target
     */
    private String separator;
    
    private String commentSeparator;
    
    /**
     * Creates a new auto-completer view.
     * @param name the name of this view
     * @param completer the completer it belongs to
     */
    public AutoCompleterView(String name, AutoCompleter completer) {
        this.name = name;
        this.completer = completer;
    }
    
    /**
     * Compute the items visible in the auto-completer list
     * @param wordChunk the string to start with
     * @return a list of strings.
     */
    public abstract List<String> computeListData(String wordChunk);

    /**
     * @return the name
     */
    public String getName() {
        return name;
    }

    /**
     * Return the tokenizer for use with the view.
     * Custom views should override this if they have special
     * tokenization needs.
     */
    public ITokenizer getTokenizer() {
        return Core.getProject().getTargetTokenizer();
    }

    /**
     * @return the separator
     */
    public String getSeparator() {
        return separator;
    }

    /**
     * @param separator the separator to set
     */
    public void setSeparator(String separator) {
        if (separator.trim().equals("")) {
            this.separator = null;
        } else {
            this.separator = separator;
        }
    }
    
    /**
     * @return the separator
     */
    public String getCommentSeparator() {
        return commentSeparator;
    }

    /**
     * @param separator the separator to set
     */
    public void setCommentSeparator(String commentSeparator) {
        if (commentSeparator.trim().equals("")) {
            this.commentSeparator = null;
        } else {
            this.commentSeparator = commentSeparator;
        }
    }
    
    public String stripComment(String input) {
        if (getCommentSeparator() == null)
            return input;
        
        int commentSeparatorPosition = input.indexOf(getCommentSeparator());
        if (commentSeparatorPosition == -1)
            return input;
        
        return input.substring(0, commentSeparatorPosition);
    }
    
    public String stripSource(String input, int separatorPosition) {
        return input.substring(0, separatorPosition);
    }
    
    public String getTargetString(String input) {
        String result = stripComment(input);
        
        if (getSeparator() == null)
            return result;
        
        int separatorPosition = result.indexOf(getSeparator());
        if (separatorPosition == -1)
            return result;
        
        return stripSource(result, separatorPosition);
    }
}
