/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package org.omegat.gui.editor.autotext;

import java.util.ArrayList;
import java.util.List;
import javax.swing.table.AbstractTableModel;
import org.omegat.core.Core;
import org.omegat.util.OStrings;

/**
 * The table model of the table in the autotext configuration window.
 * @author bartkoz
 */
public class AutotextTableModel extends AbstractTableModel {

    private List<AutotextPair> data = new ArrayList<AutotextPair>();
    
    public AutotextTableModel() {}
    
    /**
     * Load the data from the core autotext list.
     */
    public void load() {
        data.clear();
        for (AutotextPair pair:Core.getAutoText().getList()) {
            data.add(new AutotextPair(pair.source, pair.target, pair.comment));
        }
    }
    
    /**
     * Store the data to the specified autotext list. All items, where the target is not empty are stored.
     * @param autotext the target list
     */
    public void store(Autotext autotext) {
        List<AutotextPair> list = autotext.getList();
        list.clear();
        for (AutotextPair pair:data) {
            if (pair.target != null || !pair.target.isEmpty())
                list.add(new AutotextPair(pair.source, pair.target, pair.comment));
        }
    }
    
    private String[] columnNames = { OStrings.getString("AC_AUTOTEXT_ABBREVIATION"), 
        OStrings.getString("AC_AUTOTEXT_TEXT"),
        OStrings.getString("AC_AUTOTEXT_COMMENT") };
    
    @Override
    public int getRowCount() {
        return data.size();
    }

    @Override
    public int getColumnCount() {
        return columnNames.length;
    }

    @Override
    public Object getValueAt(int i, int i1) {
        AutotextPair pair = data.get(i);
        switch (i1) {
            case 0: return pair.source;
            case 1: return pair.target;
            case 2: return pair.comment;
            default: return null;
        }
    }
    
    @Override
    public String getColumnName(int col) {
      return columnNames[col];
    }
    
    @Override
    public void setValueAt(Object value, int row, int col) {
        AutotextPair pair = data.get(row);
        switch (col) {
            case 0: pair.source = (String) value; break;
            case 1: pair.target = (String) value; break;
            case 2: pair.comment = (String) value;
        }
        fireTableCellUpdated(row, col);
    }
    
    @Override
    public boolean isCellEditable(int row, int col)
        { return true; }
    
    /**
     * add a new row.
     * @param pair what to add
     * @param position at which position
     */
    public void addRow(AutotextPair pair, int position) {
        int newPosition;
        if (position == -1)
            newPosition = data.size();
        else
            newPosition = position;
        data.add(newPosition, pair);
        fireTableDataChanged();
    }
    
    /**
     * remove a row. 
     * @param position where from
     */
    public void removeRow(int position) {
        data.remove(position);
        fireTableDataChanged();
    }
    
}
