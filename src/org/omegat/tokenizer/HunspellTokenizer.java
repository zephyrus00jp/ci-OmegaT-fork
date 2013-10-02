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

package org.omegat.tokenizer;

import java.io.File;
import java.io.FileInputStream;
import java.io.StringReader;
import org.apache.lucene.analysis.TokenStream;
import org.apache.lucene.analysis.hunspell.HunspellDictionary;
import org.apache.lucene.analysis.hunspell.HunspellStemFilter;
import org.apache.lucene.analysis.standard.StandardTokenizer;
import org.apache.lucene.util.Version;
import org.omegat.core.Core;
import org.omegat.util.Language;
import org.omegat.util.OConsts;
import org.omegat.util.Preferences;


/**
 * Methods for tokenize string.
 * 
 * @author Zoltan Bartko - bartkozoltan@bartkozoltan.com
 */
@Tokenizer(languages = { "en", "hu", "sk" })
public class HunspellTokenizer extends BaseTokenizer {

    HunspellStemFilter stemFilter = null;
    HunspellDictionary dict;
    
    public HunspellDictionary getDict() {
        if (dict == null) {
            Language language;
            if (Core.getProject().getSourceTokenizer() == this)
                language = Core.getProject().getProjectProperties().getSourceLanguage();
            else
                language = Core.getProject().getProjectProperties().getTargetLanguage();
                
            // source
            String dictionaryDir = Preferences.getPreference(Preferences.SPELLCHECKER_DICTIONARY_DIRECTORY);

            if (dictionaryDir != null) {
                FileInputStream affixStream;
                FileInputStream dictStream;
                try {
                    String affixName = dictionaryDir + File.separator + language.getLocaleCode() + OConsts.SC_AFFIX_EXTENSION;
                    String dictionaryName = dictionaryDir + File.separator + language.getLocaleCode()
                            + OConsts.SC_DICTIONARY_EXTENSION;
                    affixStream = new FileInputStream(affixName);
                    dictStream = new FileInputStream(dictionaryName);

                    dict = new HunspellDictionary(affixStream, dictStream, Version.LUCENE_36);
                } catch (Exception ex) {
                    return null;
                }   
            }
        }
        return dict;
    }
@Override
    protected TokenStream getTokenStream(final String strOrig,
            final boolean stemsAllowed, final boolean stopWordsAllowed) {
        if (stemsAllowed) {
            HunspellDictionary dictionary = getDict();
            if (dict == null) {
                return new StandardTokenizer(Version.LUCENE_36,
                    new StringReader(strOrig.toLowerCase()));
            }
            
            return new HunspellStemFilter(new StandardTokenizer(Version.LUCENE_36,
                    new StringReader(strOrig.toLowerCase())),dict);
            
            /// TODO: implement stop words checks
        } else {
            return new StandardTokenizer(Version.LUCENE_36,
                    new StringReader(strOrig.toLowerCase()));
        }
    }
}
