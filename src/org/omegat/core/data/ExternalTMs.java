/**************************************************************************
 OmegaT - Computer Assisted Translation (CAT) tool 
          with fuzzy matching, translation memory, keyword search, 
          glossaries, and translation leveraging into updated projects.

 Copyright (C) 2017 Aaron Madlon-Kay
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

package org.omegat.core.data;

import java.io.File;
import java.util.Arrays;
import java.util.List;

import org.omegat.core.Core;
import org.omegat.util.OConsts;
import org.omegat.util.Preferences;

/**
 * Common utility class for external TMs.
 * 
 * @author Aaron Madlon-Kay
 *
 */
public class ExternalTMs {

    private static final List<String> SUPPORTED_FORMATS = Arrays.asList(OConsts.TMX_EXTENSION,
            OConsts.TMX_GZ_EXTENSION);

    public static boolean isSupportedFormat(File file) {
        String name = file.getName().toLowerCase();
        return SUPPORTED_FORMATS.stream().anyMatch(fmt -> name.endsWith(fmt));
    }

    public static IExternalTM load(File file) throws Exception {
        String name = file.getName().toLowerCase();
        ProjectProperties props = Core.getProject().getProjectProperties();
        if (name.endsWith(OConsts.TMX_EXTENSION) || name.endsWith(OConsts.TMX_GZ_EXTENSION)) {
            return new ExternalTMX.Loader(file)
                    .setExtTmxLevel2(Preferences.isPreference(Preferences.EXT_TMX_SHOW_LEVEL2))
                    .setUseSlash(Preferences.isPreference(Preferences.EXT_TMX_USE_SLASH))
                    .load(props.isSentenceSegmentingEnabled(), props.getSourceLanguage(),
                            props.getTargetLanguage());
        } else {
            throw new IllegalArgumentException("Unsupported external TM type: " + file.getName());
        }
    }
}
