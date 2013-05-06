/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package org.omegat.gui.editor.autotext;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.lang.String;
import java.util.ArrayList;
import java.util.List;
import org.omegat.util.OConsts;
import org.omegat.util.Preferences;
import org.omegat.util.StaticUtils;

/**
 *
 * @author bartkoz
 */
public class Autotext {
    
    private List<AutotextPair> list = new ArrayList<AutotextPair>();
    
    private String name;
    
    private String separator;
    
    public Autotext(String name) {
        this.name = name;
        
        /*list.add(new AutotextPair(null,"supercalifragilistic..."));
        list.add(new AutotextPair(null,"a wonderful sentence"));
        list.add(new AutotextPair("afaik","as far as I know"));
        */
        if (name != null)
            load(name);
    }
    
    public String getSeparator() {
        return separator;
    }
    
    public void setSeparator(String separator) {
        this.separator = separator;
    }
    
    public List<AutotextPair> getList() {
        return list;
    }

    public void processLine(String thisLine) {
        if (thisLine == null || thisLine.isEmpty() || thisLine.trim().isEmpty())
            return;
        
        String parts[] = thisLine.split(separator);
        String source;
        String target;
        if (parts.length > 1) {
            source = parts[0];
            target = parts[1];
        } else {
            source = null;
            target = parts[0];
        }
        list.add(new AutotextPair(source, target));    
    }
    
    /**
     * get the separator from the first line of the file (separator=<separator>)
     * @param firstLine the first line of the file
     */
    private void processSeparator(String firstLine) {
        int pos = firstLine.indexOf("=");
        if (pos != -1 && pos+1 < firstLine.length()) {
            separator = firstLine.substring(pos + 1);
        }
    }
    
    public void load(String fileName) {
        list.clear();
        //separator = Core.get
        BufferedReader br = null;
        try {
            br = new BufferedReader(new InputStreamReader(new FileInputStream(
                    fileName), OConsts.UTF8));

            String thisLine;
            if ((thisLine = br.readLine()) != null) {
                processSeparator(thisLine);
            }
            while ((thisLine = br.readLine()) != null) {
                processLine(thisLine);
            }
        } catch (FileNotFoundException ex) {
            // there is no default, so load nothing
        } catch (IOException ex) {
            // so now what?
        } finally {
            try {
                if (br != null) {
                    br.close();
                }
            } catch (IOException ex) {
                // so now what?
            }
        }
    }

    public void save(String filename) throws IOException {
        BufferedWriter out = new BufferedWriter(new OutputStreamWriter(new FileOutputStream(filename), OConsts.UTF8));

        out.write("Separator="+separator+"\n");
        for (AutotextPair pair:list) {
            out.write(pair.toString() + "\n");
        }
        
        out.close();
    }
    
    public void save() throws IOException {
        save(StaticUtils.getConfigDir() + Preferences.AC_AUTOTEXT_FILE_NAME);
    }
}
