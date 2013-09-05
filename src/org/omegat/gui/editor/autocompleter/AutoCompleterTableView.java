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

package org.omegat.gui.editor.autocompleter;

import java.awt.Point;
import java.awt.event.KeyEvent;
import java.util.List;
import javax.swing.JTable;
import org.omegat.util.StaticUtils;

/**
 * Table-based auto-completer view
 * 
 * @author bartkoz
 */
public abstract class AutoCompleterTableView extends AbstractAutoCompleterView {
    
    /**
     * the table. Use getTable() to access the value;
     */
    private static JTable table;
    
    /** the selected point - x: row, y: column. */
    private Point selected;
    
    public AutoCompleterTableView(String name, NewAutoCompleter completer) {
        super(name,completer);
    }
    
    /**
     * Set the selection.
     * @param p the new point
     */
    public void setSelection(Point p) {
        getTable().changeSelection(p.y, p.x, false, false);
        selected = p;
    }
    
    public JTable getTable() {
        if (table == null) {
            table = new JTable();
            table.setCellSelectionEnabled(true);
            table.setFocusable(false);
            table.setTableHeader(null);
        }
        return table;
    }
    
    @Override
    public void activateView() {
        completer.getScrollPane().setViewportView(getTable());
        if (selected == null) {
            setSelection(new Point(0,0));
        }
        super.activateView();
    }
    
    /**
     * Get the point selected in the table.
     * @return 
     */
    public Point getSelectionPoint() {
        return new Point(getTable().getSelectedColumn(),getTable().getSelectedRow());
    }
    
    @Override
    public boolean processKeys(KeyEvent e, boolean visible) {
        boolean onMac = StaticUtils.onMacOSX();
        
        if (StaticUtils.isKey(e, KeyEvent.VK_UP, 0)) {
            // process key UP
            if (visible) {
                selectPreviousPossibleValueUp();
            }
            return true;
        }

        if (StaticUtils.isKey(e, KeyEvent.VK_LEFT, 0)) {
            // process key LEFT
            if (visible) {
                selectPreviousPossibleValueLeft();
            }
            return true;
        }
        
        if (StaticUtils.isKey(e, KeyEvent.VK_DOWN, 0)) {
            // process key DOWN
            if (visible) {
                selectNextPossibleValueDown();
            }
            return true;
        }

        if (StaticUtils.isKey(e, KeyEvent.VK_RIGHT, 0)) {
            // process key RIGHT
            if (visible) {
                selectNextPossibleValueRight();
            }
            return true;
        }
        
        if (StaticUtils.isKey(e, KeyEvent.VK_PAGE_UP, 0)) {
            if (visible) {
                selectPreviousPossibleValueByPage();
            }
            return true;
        }

        if (StaticUtils.isKey(e, KeyEvent.VK_PAGE_DOWN, 0)) {
            if (visible) {
                selectNextPossibleValueByPage();
            }
            return true;
        }
        
        if ((!onMac && StaticUtils.isKey(e, KeyEvent.VK_HOME, KeyEvent.CTRL_MASK))
                    || (onMac && StaticUtils.isKey(e, KeyEvent.VK_HOME, KeyEvent.META_MASK))) {
            if (visible) {
                selectFirstPossibleValue();
            }
            return true;
        }

        if ((!onMac && StaticUtils.isKey(e, KeyEvent.VK_END, KeyEvent.CTRL_MASK))
                    || (onMac && StaticUtils.isKey(e, KeyEvent.VK_END, KeyEvent.META_MASK))) {
            if (visible) {
                selectLastPossibleValue();
            }
            return true;
        }
        
        if (StaticUtils.isKey(e, KeyEvent.VK_HOME, 0)) {
            if (visible) {
                selectFirstPossibleValueInLine();
            }
            return true;
        }

        if (StaticUtils.isKey(e, KeyEvent.VK_END, 0)) {
            if (visible) {
                selectLastPossibleValueInLine();
            }
            return true;
        }
        
        return false;
    } 
    
    /** 
     * Selects the next item in the list.  It won't change the selection if the 
     * currently selected item is already the last item. 
     */ 
    protected void selectNextPossibleValueDown() { 
        Point p = getSelectionPoint();
        
        if (p.y < getTable().getModel().getRowCount()- 1) { 
            setSelection(new Point(p.x, p.y+1));
        } 
    }
    
    /**
     * Select the first value in the table (top left).
     */
    protected void selectFirstPossibleValue() {
        setSelection(new Point(0, 0));
    }
    
    /**
     * Select the last value in the table (bottom right).
     */
    protected void selectLastPossibleValue() {
        setSelection(new Point(getTable().getModel().getColumnCount(), 
                getTable().getModel().getRowCount()));
    }
    
    /**
     * Select the first value in the current line.
     */
    protected void selectFirstPossibleValueInLine() {
        setSelection(new Point(0, getTable().getSelectedRow()));
    }
    
    /**
     * Select the last value in the current line.
     */
    protected void selectLastPossibleValueInLine() {
        setSelection(new Point(getTable().getModel().getColumnCount()-1, 
                getTable().getSelectedRow()));
    }
    
    /**
     * Go one cell to the right. No line wrapping is being done.
     */
    protected void selectNextPossibleValueRight() { 
        Point p = getSelectionPoint();
        
        if (p.x < getTable().getModel().getColumnCount()- 1) { 
            setSelection(new Point(p.x+1, p.y));
        } 
    }
    
    /** 
     * Selects the item in the list following the current one by completer.pageRowCount items or go to the first item. 
     * currently selected item is already the last item. 
     */ 
    protected void selectNextPossibleValueByPage() { 
        Point p = getSelectionPoint();
        
        int size = getTable().getModel().getRowCount();
        if (p.y < size - NewAutoCompleter.pageRowCount) { 
            setSelection(new Point(p.x, p.y+NewAutoCompleter.pageRowCount));
        } else {
            setSelection(new Point(p.x, size-1));
        }
    } 

    /** 
     * Selects the previous item in the list.  It won't change the selection if the 
     * currently selected item is already the first item. 
     */ 
    protected void selectPreviousPossibleValueUp() { 
        Point p = getSelectionPoint();
        
        if (p.y > 0) { 
            setSelection(new Point(p.x, p.y-1));
        } 
    } 
    
    /**
     * Go one cell to the left. No line wrapping is being done.
     */
    protected void selectPreviousPossibleValueLeft() { 
        Point p = getSelectionPoint();
        
        if (p.x > 0) { 
            setSelection(new Point(p.x-1, p.y));
        } 
    }
    
    /** 
     * Selects the item in the list preceding the current one by completer.pageRowCount items or go to the first item.  It won't change the selection if the 
     * currently selected item is already the first item. 
     */ 
    protected void selectPreviousPossibleValueByPage() { 
        Point p = getSelectionPoint();
        
        if (p.y > NewAutoCompleter.pageRowCount) {
            setSelection(new Point(p.x, p.y - NewAutoCompleter.pageRowCount));
        } else { 
            setSelection(new Point(p.x, 0));
        } 
    }

    @Override
    public int getRowCount() {
        return getTable().getModel().getRowCount();
    }
    
    @Override
    public int getHeight() {
        int height = getModifiedRowCount() * getTable().getRowHeight();
        height = height < 50 ? 50 : height;
        return height;
    }
    
    @Override
    public String getSelectedValue() {
        Point p = getSelectionPoint();
        Object selection = getTable().getModel().getValueAt(p.y, p.x);
        if (selection instanceof Character) {
            return selection.toString();
        }
        return (String) selection;
    }
    
    @Override
    public void setData(List<AutoCompleterItem> entryList) {
        
    }
}
