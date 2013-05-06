/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package org.omegat.gui.editor.autotext;

import org.omegat.core.Core;

/**
 *
 * @author bartkoz
 */
public class AutotextPair {

    public String source;
    public String target;

    public AutotextPair(String source, String target) {
        this.source = source;
        this.target = target;
    }
    
    @Override
    public String toString() {
        if (source == null) {
            return target;
        } else {
            return source + Core.getAutoText().getSeparator() + target;
        }
    }
}
