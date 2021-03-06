function Snowball() {
BaseStemmer = function() {
this.setCurrent = function(value) {
this.current = value;
this.cursor = 0;
this.limit = this.current.length;
this.limit_backward = 0;
this.bra = this.cursor;
this.ket = this.limit;
};
this.getCurrent = function() {
return this.current;
};
this.copy_from = function(other) {
this.current = other.current;
this.cursor = other.cursor;
this.limit = other.limit;
this.limit_backward = other.limit_backward;
this.bra = other.bra;
this.ket = other.ket;
};
this.in_grouping = function(s, min, max) {
if (this.cursor >= this.limit) return false;
var ch = this.current.charCodeAt(this.cursor);
if (ch > max || ch < min) return false;
ch -= min;
if ((s[ch >>> 3] & (0x1 << (ch & 0x7))) == 0) return false;
this.cursor++;
return true;
};
this.in_grouping_b = function(s, min, max) {
if (this.cursor <= this.limit_backward) return false;
var ch = this.current.charCodeAt(this.cursor - 1);
if (ch > max || ch < min) return false;
ch -= min;
if ((s[ch >>> 3] & (0x1 << (ch & 0x7))) == 0) return false;
this.cursor--;
return true;
};
this.out_grouping = function(s, min, max) {
if (this.cursor >= this.limit) return false;
var ch = this.current.charCodeAt(this.cursor);
if (ch > max || ch < min) {
this.cursor++;
return true;
}
ch -= min;
if ((s[ch >>> 3] & (0X1 << (ch & 0x7))) == 0) {
this.cursor++;
return true;
}
return false;
};
this.out_grouping_b = function(s, min, max) {
if (this.cursor <= this.limit_backward) return false;
var ch = this.current.charCodeAt(this.cursor - 1);
if (ch > max || ch < min) {
this.cursor--;
return true;
}
ch -= min;
if ((s[ch >>> 3] & (0x1 << (ch & 0x7))) == 0) {
this.cursor--;
return true;
}
return false;
};
this.eq_s = function(s)
{
if (this.limit - this.cursor < s.length) return false;
if (this.current.slice(this.cursor, this.cursor + s.length) != s)
{
return false;
}
this.cursor += s.length;
return true;
};
this.eq_s_b = function(s)
{
if (this.cursor - this.limit_backward < s.length) return false;
if (this.current.slice(this.cursor - s.length, this.cursor) != s)
{
return false;
}
this.cursor -= s.length;
return true;
};
 this.find_among = function(v)
{
var i = 0;
var j = v.length;
var c = this.cursor;
var l = this.limit;
var common_i = 0;
var common_j = 0;
var first_key_inspected = false;
while (true)
{
var k = i + ((j - i) >>> 1);
var diff = 0;
var common = common_i < common_j ? common_i : common_j; 
var w = v[k];
var i2;
for (i2 = common; i2 < w[0].length; i2++)
{
if (c + common == l)
{
diff = -1;
break;
}
diff = this.current.charCodeAt(c + common) - w[0].charCodeAt(i2);
if (diff != 0) break;
common++;
}
if (diff < 0)
{
j = k;
common_j = common;
}
else
{
i = k;
common_i = common;
}
if (j - i <= 1)
{
if (i > 0) break; 
if (j == i) break; 
if (first_key_inspected) break;
first_key_inspected = true;
}
}
do {
var w = v[i];
if (common_i >= w[0].length)
{
this.cursor = c + w[0].length;
if (w.length < 4) return w[2];
var res = w[3](this);
this.cursor = c + w[0].length;
if (res) return w[2];
}
i = w[1];
} while (i >= 0);
return 0;
};
this.find_among_b = function(v)
{
var i = 0;
var j = v.length
var c = this.cursor;
var lb = this.limit_backward;
var common_i = 0;
var common_j = 0;
var first_key_inspected = false;
while (true)
{
var k = i + ((j - i) >> 1);
var diff = 0;
var common = common_i < common_j ? common_i : common_j;
var w = v[k];
var i2;
for (i2 = w[0].length - 1 - common; i2 >= 0; i2--)
{
if (c - common == lb)
{
diff = -1;
break;
}
diff = this.current.charCodeAt(c - 1 - common) - w[0].charCodeAt(i2);
if (diff != 0) break;
common++;
}
if (diff < 0)
{
j = k;
common_j = common;
}
else
{
i = k;
common_i = common;
}
if (j - i <= 1)
{
if (i > 0) break;
if (j == i) break;
if (first_key_inspected) break;
first_key_inspected = true;
}
}
do {
var w = v[i];
if (common_i >= w[0].length)
{
this.cursor = c - w[0].length;
if (w.length < 4) return w[2];
var res = w[3](this);
this.cursor = c - w[0].length;
if (res) return w[2];
}
i = w[1];
} while (i >= 0);
return 0;
};
this.replace_s = function(c_bra, c_ket, s)
{
var adjustment = s.length - (c_ket - c_bra);
this.current = this.current.slice(0, c_bra) + s + this.current.slice(c_ket);
this.limit += adjustment;
if (this.cursor >= c_ket) this.cursor += adjustment;
else if (this.cursor > c_bra) this.cursor = c_bra;
return adjustment;
};
this.slice_check = function()
{
if (this.bra < 0 ||
this.bra > this.ket ||
this.ket > this.limit ||
this.limit > this.current.length)
{
return false;
}
return true;
};
this.slice_from = function(s)
{
var result = false;
if (this.slice_check())
{
this.replace_s(this.bra, this.ket, s);
result = true;
}
return result;
};
this.slice_del = function()
{
return this.slice_from("");
};
this.insert = function(c_bra, c_ket, s)
{
var adjustment = this.replace_s(c_bra, c_ket, s);
if (c_bra <= this.bra) this.bra += adjustment;
if (c_bra <= this.ket) this.ket += adjustment;
};
this.slice_to = function()
{
var result = '';
if (this.slice_check())
{
result = this.current.slice(this.bra, this.ket);
}
return result;
};
this.assign_to = function()
{
return this.current.slice(0, this.limit);
};
};
EnglishStemmer = function() {
var base = new BaseStemmer();
 var a_0 = [
["arsen", -1, -1],
["commun", -1, -1],
["gener", -1, -1]
];
 var a_1 = [
["'", -1, 1],
["'s'", 0, 1],
["'s", -1, 1]
];
 var a_2 = [
["ied", -1, 2],
["s", -1, 3],
["ies", 1, 2],
["sses", 1, 1],
["ss", 1, -1],
["us", 1, -1]
];
 var a_3 = [
["", -1, 3],
["bb", 0, 2],
["dd", 0, 2],
["ff", 0, 2],
["gg", 0, 2],
["bl", 0, 1],
["mm", 0, 2],
["nn", 0, 2],
["pp", 0, 2],
["rr", 0, 2],
["at", 0, 1],
["tt", 0, 2],
["iz", 0, 1]
];
 var a_4 = [
["ed", -1, 2],
["eed", 0, 1],
["ing", -1, 2],
["edly", -1, 2],
["eedly", 3, 1],
["ingly", -1, 2]
];
 var a_5 = [
["anci", -1, 3],
["enci", -1, 2],
["ogi", -1, 13],
["li", -1, 15],
["bli", 3, 12],
["abli", 4, 4],
["alli", 3, 8],
["fulli", 3, 9],
["lessli", 3, 14],
["ousli", 3, 10],
["entli", 3, 5],
["aliti", -1, 8],
["biliti", -1, 12],
["iviti", -1, 11],
["tional", -1, 1],
["ational", 14, 7],
["alism", -1, 8],
["ation", -1, 7],
["ization", 17, 6],
["izer", -1, 6],
["ator", -1, 7],
["iveness", -1, 11],
["fulness", -1, 9],
["ousness", -1, 10]
];
 var a_6 = [
["icate", -1, 4],
["ative", -1, 6],
["alize", -1, 3],
["iciti", -1, 4],
["ical", -1, 4],
["tional", -1, 1],
["ational", 5, 2],
["ful", -1, 5],
["ness", -1, 5]
];
 var a_7 = [
["ic", -1, 1],
["ance", -1, 1],
["ence", -1, 1],
["able", -1, 1],
["ible", -1, 1],
["ate", -1, 1],
["ive", -1, 1],
["ize", -1, 1],
["iti", -1, 1],
["al", -1, 1],
["ism", -1, 1],
["ion", -1, 2],
["er", -1, 1],
["ous", -1, 1],
["ant", -1, 1],
["ent", -1, 1],
["ment", 15, 1],
["ement", 16, 1]
];
 var a_8 = [
["e", -1, 1],
["l", -1, 2]
];
 var a_9 = [
["succeed", -1, -1],
["proceed", -1, -1],
["exceed", -1, -1],
["canning", -1, -1],
["inning", -1, -1],
["earring", -1, -1],
["herring", -1, -1],
["outing", -1, -1]
];
 var a_10 = [
["andes", -1, -1],
["atlas", -1, -1],
["bias", -1, -1],
["cosmos", -1, -1],
["dying", -1, 3],
["early", -1, 9],
["gently", -1, 7],
["howe", -1, -1],
["idly", -1, 6],
["lying", -1, 4],
["news", -1, -1],
["only", -1, 10],
["singly", -1, 11],
["skies", -1, 2],
["skis", -1, 1],
["sky", -1, -1],
["tying", -1, 5],
["ugly", -1, 8]
];
 var  g_v = [17, 65, 16, 1];
 var  g_v_WXY = [1, 17, 65, 208, 1];
 var  g_valid_LI = [55, 141, 2];
var  B_Y_found = false;
var  I_p2 = 0;
var  I_p1 = 0;
function r_prelude() {
B_Y_found = false;
var  v_1 = base.cursor;
lab0: {
base.bra = base.cursor;
if (!(base.eq_s("'")))
{
break lab0;
}
base.ket = base.cursor;
if (!base.slice_del())
{
return false;
}
}
base.cursor = v_1;
var  v_2 = base.cursor;
lab1: {
base.bra = base.cursor;
if (!(base.eq_s("y")))
{
break lab1;
}
base.ket = base.cursor;
if (!base.slice_from("Y"))
{
return false;
}
B_Y_found = true;
}
base.cursor = v_2;
var  v_3 = base.cursor;
lab2: {
while(true)
{
var  v_4 = base.cursor;
lab3: {
golab4: while(true)
{
var  v_5 = base.cursor;
lab5: {
if (!(base.in_grouping(g_v, 97, 121)))
{
break lab5;
}
base.bra = base.cursor;
if (!(base.eq_s("y")))
{
break lab5;
}
base.ket = base.cursor;
base.cursor = v_5;
break golab4;
}
base.cursor = v_5;
if (base.cursor >= base.limit)
{
break lab3;
}
base.cursor++;
}
if (!base.slice_from("Y"))
{
return false;
}
B_Y_found = true;
continue;
}
base.cursor = v_4;
break;
}
}
base.cursor = v_3;
return true;
};
function r_mark_regions() {
I_p1 = base.limit;
I_p2 = base.limit;
var  v_1 = base.cursor;
lab0: {
lab1: {
var  v_2 = base.cursor;
lab2: {
if (base.find_among(a_0) == 0)
{
break lab2;
}
break lab1;
}
base.cursor = v_2;
golab3: while(true)
{
lab4: {
if (!(base.in_grouping(g_v, 97, 121)))
{
break lab4;
}
break golab3;
}
if (base.cursor >= base.limit)
{
break lab0;
}
base.cursor++;
}
golab5: while(true)
{
lab6: {
if (!(base.out_grouping(g_v, 97, 121)))
{
break lab6;
}
break golab5;
}
if (base.cursor >= base.limit)
{
break lab0;
}
base.cursor++;
}
}
I_p1 = base.cursor;
golab7: while(true)
{
lab8: {
if (!(base.in_grouping(g_v, 97, 121)))
{
break lab8;
}
break golab7;
}
if (base.cursor >= base.limit)
{
break lab0;
}
base.cursor++;
}
golab9: while(true)
{
lab10: {
if (!(base.out_grouping(g_v, 97, 121)))
{
break lab10;
}
break golab9;
}
if (base.cursor >= base.limit)
{
break lab0;
}
base.cursor++;
}
I_p2 = base.cursor;
}
base.cursor = v_1;
return true;
};
function r_shortv() {
lab0: {
var  v_1 = base.limit - base.cursor;
lab1: {
if (!(base.out_grouping_b(g_v_WXY, 89, 121)))
{
break lab1;
}
if (!(base.in_grouping_b(g_v, 97, 121)))
{
break lab1;
}
if (!(base.out_grouping_b(g_v, 97, 121)))
{
break lab1;
}
break lab0;
}
base.cursor = base.limit - v_1;
if (!(base.out_grouping_b(g_v, 97, 121)))
{
return false;
}
if (!(base.in_grouping_b(g_v, 97, 121)))
{
return false;
}
if (base.cursor > base.limit_backward)
{
return false;
}
}
return true;
};
function r_R1() {
if (!(I_p1 <= base.cursor))
{
return false;
}
return true;
};
function r_R2() {
if (!(I_p2 <= base.cursor))
{
return false;
}
return true;
};
function r_Step_1a() {
var  among_var;
var  v_1 = base.limit - base.cursor;
lab0: {
base.ket = base.cursor;
if (base.find_among_b(a_1) == 0)
{
base.cursor = base.limit - v_1;
break lab0;
}
base.bra = base.cursor;
if (!base.slice_del())
{
return false;
}
}
base.ket = base.cursor;
among_var = base.find_among_b(a_2);
if (among_var == 0)
{
return false;
}
base.bra = base.cursor;
switch (among_var) {
case 1:
if (!base.slice_from("ss"))
{
return false;
}
break;
case 2:
lab1: {
var  v_2 = base.limit - base.cursor;
lab2: {
{
var  c1 = base.cursor - 2;
if (base.limit_backward > c1 || c1 > base.limit)
{
break lab2;
}
base.cursor = c1;
}
if (!base.slice_from("i"))
{
return false;
}
break lab1;
}
base.cursor = base.limit - v_2;
if (!base.slice_from("ie"))
{
return false;
}
}
break;
case 3:
if (base.cursor <= base.limit_backward)
{
return false;
}
base.cursor--;
golab3: while(true)
{
lab4: {
if (!(base.in_grouping_b(g_v, 97, 121)))
{
break lab4;
}
break golab3;
}
if (base.cursor <= base.limit_backward)
{
return false;
}
base.cursor--;
}
if (!base.slice_del())
{
return false;
}
break;
}
return true;
};
function r_Step_1b() {
var  among_var;
base.ket = base.cursor;
among_var = base.find_among_b(a_4);
if (among_var == 0)
{
return false;
}
base.bra = base.cursor;
switch (among_var) {
case 1:
if (!r_R1())
{
return false;
}
if (!base.slice_from("ee"))
{
return false;
}
break;
case 2:
var  v_1 = base.limit - base.cursor;
golab0: while(true)
{
lab1: {
if (!(base.in_grouping_b(g_v, 97, 121)))
{
break lab1;
}
break golab0;
}
if (base.cursor <= base.limit_backward)
{
return false;
}
base.cursor--;
}
base.cursor = base.limit - v_1;
if (!base.slice_del())
{
return false;
}
var  v_3 = base.limit - base.cursor;
among_var = base.find_among_b(a_3);
if (among_var == 0)
{
return false;
}
base.cursor = base.limit - v_3;
switch (among_var) {
case 1:
{
var  c1 = base.cursor;
base.insert(base.cursor, base.cursor, "e");
base.cursor = c1;
}
break;
case 2:
base.ket = base.cursor;
if (base.cursor <= base.limit_backward)
{
return false;
}
base.cursor--;
base.bra = base.cursor;
if (!base.slice_del())
{
return false;
}
break;
case 3:
if (base.cursor != I_p1)
{
return false;
}
var  v_4 = base.limit - base.cursor;
if (!r_shortv())
{
return false;
}
base.cursor = base.limit - v_4;
{
var  c2 = base.cursor;
base.insert(base.cursor, base.cursor, "e");
base.cursor = c2;
}
break;
}
break;
}
return true;
};
function r_Step_1c() {
base.ket = base.cursor;
lab0: {
var  v_1 = base.limit - base.cursor;
lab1: {
if (!(base.eq_s_b("y")))
{
break lab1;
}
break lab0;
}
base.cursor = base.limit - v_1;
if (!(base.eq_s_b("Y")))
{
return false;
}
}
base.bra = base.cursor;
if (!(base.out_grouping_b(g_v, 97, 121)))
{
return false;
}
lab2: {
if (base.cursor > base.limit_backward)
{
break lab2;
}
return false;
}
if (!base.slice_from("i"))
{
return false;
}
return true;
};
function r_Step_2() {
var  among_var;
base.ket = base.cursor;
among_var = base.find_among_b(a_5);
if (among_var == 0)
{
return false;
}
base.bra = base.cursor;
if (!r_R1())
{
return false;
}
switch (among_var) {
case 1:
if (!base.slice_from("tion"))
{
return false;
}
break;
case 2:
if (!base.slice_from("ence"))
{
return false;
}
break;
case 3:
if (!base.slice_from("ance"))
{
return false;
}
break;
case 4:
if (!base.slice_from("able"))
{
return false;
}
break;
case 5:
if (!base.slice_from("ent"))
{
return false;
}
break;
case 6:
if (!base.slice_from("ize"))
{
return false;
}
break;
case 7:
if (!base.slice_from("ate"))
{
return false;
}
break;
case 8:
if (!base.slice_from("al"))
{
return false;
}
break;
case 9:
if (!base.slice_from("ful"))
{
return false;
}
break;
case 10:
if (!base.slice_from("ous"))
{
return false;
}
break;
case 11:
if (!base.slice_from("ive"))
{
return false;
}
break;
case 12:
if (!base.slice_from("ble"))
{
return false;
}
break;
case 13:
if (!(base.eq_s_b("l")))
{
return false;
}
if (!base.slice_from("og"))
{
return false;
}
break;
case 14:
if (!base.slice_from("less"))
{
return false;
}
break;
case 15:
if (!(base.in_grouping_b(g_valid_LI, 99, 116)))
{
return false;
}
if (!base.slice_del())
{
return false;
}
break;
}
return true;
};
function r_Step_3() {
var  among_var;
base.ket = base.cursor;
among_var = base.find_among_b(a_6);
if (among_var == 0)
{
return false;
}
base.bra = base.cursor;
if (!r_R1())
{
return false;
}
switch (among_var) {
case 1:
if (!base.slice_from("tion"))
{
return false;
}
break;
case 2:
if (!base.slice_from("ate"))
{
return false;
}
break;
case 3:
if (!base.slice_from("al"))
{
return false;
}
break;
case 4:
if (!base.slice_from("ic"))
{
return false;
}
break;
case 5:
if (!base.slice_del())
{
return false;
}
break;
case 6:
if (!r_R2())
{
return false;
}
if (!base.slice_del())
{
return false;
}
break;
}
return true;
};
function r_Step_4() {
var  among_var;
base.ket = base.cursor;
among_var = base.find_among_b(a_7);
if (among_var == 0)
{
return false;
}
base.bra = base.cursor;
if (!r_R2())
{
return false;
}
switch (among_var) {
case 1:
if (!base.slice_del())
{
return false;
}
break;
case 2:
lab0: {
var  v_1 = base.limit - base.cursor;
lab1: {
if (!(base.eq_s_b("s")))
{
break lab1;
}
break lab0;
}
base.cursor = base.limit - v_1;
if (!(base.eq_s_b("t")))
{
return false;
}
}
if (!base.slice_del())
{
return false;
}
break;
}
return true;
};
function r_Step_5() {
var  among_var;
base.ket = base.cursor;
among_var = base.find_among_b(a_8);
if (among_var == 0)
{
return false;
}
base.bra = base.cursor;
switch (among_var) {
case 1:
lab0: {
var  v_1 = base.limit - base.cursor;
lab1: {
if (!r_R2())
{
break lab1;
}
break lab0;
}
base.cursor = base.limit - v_1;
if (!r_R1())
{
return false;
}
{
var  v_2 = base.limit - base.cursor;
lab2: {
if (!r_shortv())
{
break lab2;
}
return false;
}
base.cursor = base.limit - v_2;
}
}
if (!base.slice_del())
{
return false;
}
break;
case 2:
if (!r_R2())
{
return false;
}
if (!(base.eq_s_b("l")))
{
return false;
}
if (!base.slice_del())
{
return false;
}
break;
}
return true;
};
function r_exception2() {
base.ket = base.cursor;
if (base.find_among_b(a_9) == 0)
{
return false;
}
base.bra = base.cursor;
if (base.cursor > base.limit_backward)
{
return false;
}
return true;
};
function r_exception1() {
var  among_var;
base.bra = base.cursor;
among_var = base.find_among(a_10);
if (among_var == 0)
{
return false;
}
base.ket = base.cursor;
if (base.cursor < base.limit)
{
return false;
}
switch (among_var) {
case 1:
if (!base.slice_from("ski"))
{
return false;
}
break;
case 2:
if (!base.slice_from("sky"))
{
return false;
}
break;
case 3:
if (!base.slice_from("die"))
{
return false;
}
break;
case 4:
if (!base.slice_from("lie"))
{
return false;
}
break;
case 5:
if (!base.slice_from("tie"))
{
return false;
}
break;
case 6:
if (!base.slice_from("idl"))
{
return false;
}
break;
case 7:
if (!base.slice_from("gentl"))
{
return false;
}
break;
case 8:
if (!base.slice_from("ugli"))
{
return false;
}
break;
case 9:
if (!base.slice_from("earli"))
{
return false;
}
break;
case 10:
if (!base.slice_from("onli"))
{
return false;
}
break;
case 11:
if (!base.slice_from("singl"))
{
return false;
}
break;
}
return true;
};
function r_postlude() {
if (!B_Y_found)
{
return false;
}
while(true)
{
var  v_1 = base.cursor;
lab0: {
golab1: while(true)
{
var  v_2 = base.cursor;
lab2: {
base.bra = base.cursor;
if (!(base.eq_s("Y")))
{
break lab2;
}
base.ket = base.cursor;
base.cursor = v_2;
break golab1;
}
base.cursor = v_2;
if (base.cursor >= base.limit)
{
break lab0;
}
base.cursor++;
}
if (!base.slice_from("y"))
{
return false;
}
continue;
}
base.cursor = v_1;
break;
}
return true;
};
this.stem =  function() {
lab0: {
var  v_1 = base.cursor;
lab1: {
if (!r_exception1())
{
break lab1;
}
break lab0;
}
base.cursor = v_1;
lab2: {
{
var  v_2 = base.cursor;
lab3: {
{
var  c1 = base.cursor + 3;
if (0 > c1 || c1 > base.limit)
{
break lab3;
}
base.cursor = c1;
}
break lab2;
}
base.cursor = v_2;
}
break lab0;
}
base.cursor = v_1;
r_prelude();
r_mark_regions();
base.limit_backward = base.cursor; base.cursor = base.limit;
var  v_5 = base.limit - base.cursor;
r_Step_1a();
base.cursor = base.limit - v_5;
lab4: {
var  v_6 = base.limit - base.cursor;
lab5: {
if (!r_exception2())
{
break lab5;
}
break lab4;
}
base.cursor = base.limit - v_6;
var  v_7 = base.limit - base.cursor;
r_Step_1b();
base.cursor = base.limit - v_7;
var  v_8 = base.limit - base.cursor;
r_Step_1c();
base.cursor = base.limit - v_8;
var  v_9 = base.limit - base.cursor;
r_Step_2();
base.cursor = base.limit - v_9;
var  v_10 = base.limit - base.cursor;
r_Step_3();
base.cursor = base.limit - v_10;
var  v_11 = base.limit - base.cursor;
r_Step_4();
base.cursor = base.limit - v_11;
var  v_12 = base.limit - base.cursor;
r_Step_5();
base.cursor = base.limit - v_12;
}
base.cursor = base.limit_backward;
var  v_13 = base.cursor;
r_postlude();
base.cursor = v_13;
}
return true;
};
this['stemWord'] = function(word) {
base.setCurrent(word);
this.stem();
return base.getCurrent();
};
};
return new EnglishStemmer();
}
wh.search_stemmer = Snowball();
wh.search_baseNameList = [
 "appendix.dictionaries.html",
 "appendix.glossaries.html",
 "appendix.regexp.html",
 "appendix.shortcut.custom.html",
 "appendix.spellchecker.html",
 "chapter.installing.and.running.html",
 "howtos.html",
 "index.html",
 "menus.html",
 "panes.html",
 "project.folder.html",
 "windows.and.dialogs.html"
];
wh.search_titleList = [
 "Appendix??A.??Slovn??ky",
 "Appendix??B.??Glos????e",
 "Appendix??D.??Regul??rn?? v??razy",
 "Appendix??E.??P??izp??soben?? kl??vesov??ch zkratek",
 "Appendix??C.??Kontrola pravopisu",
 "Instalace a provoz programu OmegaT",
 "Jak na to...",
 "OmegaT 4.2 - U??ivatelsk?? p????ru??ka",
 "Nab??dka",
 "Podokna",
 "Adres???? projektu",
 "Okna a dialogov?? okna"
];
wh.search_wordMap= {
"spravovat": [6,7],
"stisknut??": [[8,11]],
"zad??n??m": [[5,11]],
"instala??n??m": [11],
"souborem": [[8,11]],
"bloki": [[2,7,11]],
"obzvl????t??": [11,[5,6,8]],
"oktalovou": [2],
"velikost??": [11],
"ten": [9,[8,11],5],
"doleva": [6,7],
"info.plist": [5],
"p??r": [[5,11],[6,9]],
"postupi": [11],
"byla": [6,8,[4,5,10]],
"prohled??v??": [11],
"fuzzi": [11],
"statusu": [11],
"sad??": [2],
"validov??n": [9],
"z??st??v??": [11],
"spolu": [11],
"vytvo????t": [11,[5,6],10],
"specifikovat": [5,11],
"bylo": [11,[5,6,8]],
"postupu": [6],
"spustit": [5,11],
"sleduj??": [9],
"n??kter??ch": [[6,10,11]],
"byli": [8,11,[6,9,10]],
"rohu": [9],
"samo": [2],
"robustn??": [6],
"k??du": [[4,5,11],7],
"dgoogle.api.key": [5],
"roli": [6],
"projev??": [11],
"jednoduch??ho": [11],
"nedoc??l??t": [9],
"edittagnextmissedmenuitem": [3],
"poskytnout": [9],
"hlavn??m": [[6,9]],
"spou??t??c??mu": [5],
"sama": [11],
"zak??zat": [11],
"quiet": [5],
"sami": [[1,2,5]],
"ko??enov??mu": [6],
"koleg??": [9],
"zp??sob??": [[6,10]],
"m??lo": [11,0],
"es_es.d": [4],
"n??sleduj??": [8],
"z??kladn??ch": [11],
"the": [5,[0,2]],
"ovl??dat": [[5,11]],
"strukturi": [10,11],
"stiskem": [11,[8,9],[1,5]],
"komprimovat": [11],
"????inn??j????": [2],
"projectimportmenuitem": [3],
"m??la": [11,3],
"vy??e??it": [6],
"alternativn??mi": [11],
"opou??t??t": [11],
"pravidel": [11,[2,4]],
"struktura": [10,11],
"nov??m": [[1,6]],
"imag": [5],
"spoj??": [11],
"m??li": [[6,11],[0,5]],
"textovou": [6],
"nezlomiteln??": [8,3],
"tuto": [11,8,[5,6,10]],
"spravov??ni": [6],
"kontrol": [4,11],
"rusk??m": [5],
"obsahuj??c??": [11,[6,8],[5,9,10]],
"nainstalov??n": [4],
"alternativn??ho": [[9,11]],
"ru??n??": [11,4],
"komplexn??j????": [2],
"plochu": [5],
"currsegment.getsrctext": [11],
"tip": [11,[5,6]],
"zrdoje": [9],
"naposledi": [6],
"export": [6,[1,11]],
"z??le??et": [6],
"db??t": [6],
"velikosti": [11,9],
"aktu??ln??m": [9,11,[1,8],10],
"akceptov??no": [10],
"naho??": [11,[2,9],[1,5,6]],
"zp??tnou": [9],
"ud??lost??": [3],
"transtip": [[3,9],1],
"akceptov??ni": [3],
"preventivn??": [6],
"vygenerov??n": [8],
"obvykl": [[5,10]],
"xxxx9xxxx9xxxxxxxx9xxx99xxxxx9xx9xxxxxxxxxx": [5],
"poskytuj??": [11,6],
"kl??????": [11],
"tla????tek": [11],
"nerozum??": [6],
"m??ni": [2],
"fr-fr": [4],
"naopak": [11,6],
"te??": [[3,11]],
"zm??n??n??m": [11],
"druh??": [[1,5,9]],
"prost??m": [6,[5,11]],
"sam??": [8],
"nejm??n??": [6],
"up??ednost??ovat": [6],
"primari": [5],
"aktivn??": [8,[4,9,11]],
"byst": [[6,11],[2,3,5]],
"druh??": [3],
"root": [3],
"xmxzzm": [5],
"webster": [0,[7,9]],
"nezm??n??n??": [11],
"d??leno": [9],
"sam??": [1],
"aktualizac??ch": [11],
"nach??zej??": [11,6],
"chovat": [11],
"cjk": [11],
"platform??": [5],
"napsat": [1],
"nejv??c": [9],
"vy??e??en": [1],
"n??sledujt": [[4,6]],
"stisknut??": [3],
"nezahltila": [11],
"spou??t??c??ho": [5],
"ko??enov??ho": [6],
"syntax": [11,3],
"??i": [11,[5,6,9],[1,10]],
"empti": [[5,8,11]],
"v??bec": [11,2,5],
"p??esunout": [11,8],
"syst??mov??ho": [5],
"glos??????ch": [[9,11]],
"odpov??d??": [11,8,[3,4,10]],
"docku": [5],
"pravideln??ch": [6],
"tmx": [[6,10],5,11,8,[3,9]],
"repo_for_all_omegat_team_project": [6],
"barevn??": [11],
"ud??losti": [3],
"p??ekl??d??n": [[5,10]],
"nl-en": [6],
"importujt": [6],
"otev??eno": [11,8],
"grafick??ho": [10],
"za????tek": [[1,2,11]],
"integ": [11],
"naz??vat": [5],
"intel": [5,7],
"fr-ca": [11],
"mainmenushortcuts.properti": [3],
"uvoln??n??": [3],
"a??koliv": [11],
"zaktualizujet": [11],
"alternativn??ch": [[8,9]],
"m??n??": [[6,11]],
"p??ekl??d??t": [11,6,9],
"navrhov??n??": [8],
"cmd": [[5,6,11]],
"ignorov??n": [11],
"coach": [2],
"vyskakovac??": [[4,8,9,11]],
"r??zn??mi": [[6,11]],
"p??eklad??dat": [6],
"gotohistorybackmenuitem": [3],
"opravu": [8],
"opravi": [11,6],
"ka??d??ho": [11],
"parametri": [5,6,11],
"stisknut??m": [[6,11]],
"project-save.tmx": [6],
"tom": [11,9,[8,10]],
"p????stupu": [11],
"p??elo??ili": [4],
"otev??eni": [8],
"powerpc": [5],
"vpravo": [[6,11],5],
"minut??ch": [11],
"tou": [5],
"zp??sobi": [6,5,[1,4,11]],
"zpravidla": [11],
"otev??ena": [9],
"dostanet": [11],
"avail": [5],
"instalovat": [4,5],
"po????dat": [6],
"ru??n??": [[6,11],1,[4,8]],
"otev??en??mu": [9],
"aktivuj": [[8,11]],
"nezasahuj": [1],
"barevn??": [8],
"t??matu": [[6,10],[9,11]],
"kompletn??": [[5,11],[3,6,9]],
"vz??jemn??": [6],
"kter??ch": [11,1],
"projekt": [6,11,8,5,10,[1,3],7,9,[0,4]],
"zapnuta": [11],
"remot": [5],
"reprezentuj??": [[5,11]],
"upravuj": [[6,9,11]],
"navrhovan??": [8],
"va??em": [5,[4,8],[1,6,10]],
"nenahraj": [5],
"proce": [6,[9,11]],
"dokument.xx.docx": [11],
"omegat.sourceforge.io": [5],
"pipe": [11],
"pozad??": [10,[8,9]],
"vytv????en??m": [11],
"pam????mi": [11],
"otev??en??": [6,[3,5,11]],
"translat": [11,5,[4,8]],
"platformi": [5],
"????n??tini": [[5,6]],
"otev??en??": [[1,9,11],[3,5]],
"mo??nsti": [11],
"alignovat": [8],
"m??stn??": [[6,8],5],
"typick??ch": [5],
"nejm????": [2],
"ud??l??": [11],
"lok??ln??m": [6],
"kontrolovat": [4],
"neform??tovan??m": [[6,11]],
"p??elo??en??m": [11],
"v??dom??": [5],
"z??kladn??ho": [11],
"vypadat": [5],
"docs_devel": [5],
"otev??en??": [8],
"b??????": [5],
"vymezuj": [2],
"gnome": [5],
"zp??sob??": [[5,11]],
"nahrazuj": [9],
"kategori": [2,7],
"bezplatn??": [5],
"sv??tle": [8],
"m??stn??": [8],
"va??ich": [9],
"vzd??len??mi": [11],
"vynech??": [[6,11]],
"nemaj??": [9],
"pravopisem": [8],
"ka??dou": [11],
"tvar": [[1,11]],
"prev": [[0,1,2,3,4,5,6,8,9,10,11]],
"csv": [1],
"skryli": [11],
"pod??v??": [9],
"tvari": [1],
"soubor??": [11,6,[8,10],[1,4,5],3],
"napln??t": [10],
"vy??adovat": [8],
"cti": [11],
"dock": [5],
"press": [9],
"p??ejd": [8],
"zv??razn??n": [9],
"lep????": [11,4],
"p??????ini": [5],
"jak??m": [11],
"v??stupn??": [6],
"r??mci": [6,11,[5,8,9]],
"dmicrosoft.api.client_secret": [5],
"??asu": [6],
"??pou??t????": [5],
"prov??d??ni": [11],
"skrpiti": [11],
"tvaru": [11,1],
"pracovn??": [[5,10]],
"samoz??ejm??": [[4,10],[5,11]],
"vid??m": [[1,9]],
"mal??ch": [5],
"synchronizov??n": [6],
"ctrl": [3,11,9,6,8,1,[0,10]],
"star??": [5],
"za??krt??vac??ho": [11],
"document": [[2,11]],
"parametr??": [5,6],
"z??stane": [11,10],
"nad??l": [11],
"vid??t": [9],
"chybn??m": [11],
"moment": [8],
"??ast??ch": [11],
"domovsk??": [5],
"stavu": [6,9,[10,11]],
"kontextov??": [11],
"naps??n??m": [11],
"star??": [[5,11]],
"resourc": [5],
"lokalizac": [6],
"zadan??ch": [[5,11]],
"zvukov??": [2],
"sou????st??": [10],
"p??ehl": [[6,9,11]],
"proch??z??t": [11],
"velk??ch": [[2,5,11]],
"team": [6],
"jin??ch": [5,[6,9]],
"xx_yy": [[6,11]],
"docx": [[6,11],8],
"txt": [1,[9,11]],
"dialogov??": [11,8,1],
"dialogov??": [11,[7,8,9]],
"v??m??n??": [1],
"sna??it": [2],
"tedi": [5,11,[1,6,10]],
"tohoto": [11,8,10,5,[1,4,6,9]],
"segmenta??n??": [[6,10,11]],
"p????kazi": [11,[5,8]],
"hodn??": [11],
"typ": [11,6],
"platforem": [5],
"trnsl": [5],
"co??": [11,[1,5,6]],
"definic": [[3,11]],
"st??le": [11],
"viewdisplaymodificationinfoselectedradiobuttonmenuitem": [3],
"u??ivatelsk??ho": [[5,11]],
"index.html": [5],
"omegat.tmx": [6],
"za??krtno": [11],
"p????kazu": [5,8,11],
"dvoj??m": [5],
"kontrolov": [11],
"p????m??": [5],
"startu": [5,6],
"za????nat": [3],
"adres????": [6,5,10,11,[3,4,8],9,[0,1],7],
"poskytovatel": [11],
"zve??ejn??t": [6],
"sm??r": [6],
"????st": [9,[5,8,11],4],
"spr??vou": [6],
"tzn": [[6,9,11]],
"diffrevers": [11],
"zablokov??n??": [5],
"nov??ho": [11,6,[2,5,10]],
"tzv": [11],
"list??": [11],
"vyberet": [11,[5,8],9],
"spojit": [6],
"p??echod": [1],
"zautomatizuj??": [5],
"zm??n??te": [11,6],
"p??eps??n": [11],
"p??idat": [11,6,5,3,[1,4,8]],
"p??ekl??dan??m": [10],
"p??ibli??n??ch": [[8,9],[3,6,11]],
"technick??ch": [8],
"otev??en??ho": [[3,8]],
"nejlep????": [10],
"posl??n??m": [6],
"nahr??v??": [11],
"nejbli??????": [11],
"standardn??": [[4,11],[5,6]],
"kter??koliv": [9],
"evropsk??ch": [11],
"dal????": [8,11,3,9,[5,6],2],
"????nsk??ho": [6],
"project.gettranslationinfo": [11],
"pova??ov??n": [11],
"spr??vn??": [[1,5,10]],
"opat??en??": [6],
"nejedine??n??": [[8,11],3],
"importovan??": [6],
"pom????": [6],
"spr??vn??": [5],
"r??zn??ch": [11,6,8],
"vyzkou??et": [[2,11]],
"start": [5,7],
"nejedine??n??": [11],
"neukl??d??": [5],
"po????te??n??ch": [11],
"dob??": [[1,11]],
"srolovat": [11],
"asociov??ni": [5,8],
"nezahrn": [11],
"projektov??ho": [0],
"zp??sob": [11,5],
"jazykovou": [[0,4]],
"equal": [5],
"spolehliv??": [11],
"doln??": [11],
"kliknet": [11,9,[1,4]],
"spolehliv??": [10],
"optionsalwaysconfirmquitcheckboxmenuitem": [3],
"jazyc??ch": [[1,6]],
"priorita": [11],
"tvar??": [11],
"orientovan??": [11],
"pozd??j????": [[10,11]],
"v??nujt": [5],
"za??net": [6],
"c??lov??m": [11,8,[5,9]],
"skop??rov??ni": [11],
"upravit": [11,[3,6,7,8],[5,9]],
"enter": [11,[3,5,8]],
"viterbiho": [11],
"dom??nu": [11],
"souboru": [11,[5,6],8,1,[3,9],[7,10],4],
"prioriti": [[5,11]],
"blok??": [11],
"rozli??ov??n??": [11],
"projectteamnewmenuitem": [3],
"soubori": [11,6,5,10,8,4,[3,9],1,0,7],
"prioritu": [6],
"dojd": [11],
"directorate-gener": [8],
"dob??": [6],
"takov??muto": [11],
"barvou": [11],
"memori": [5],
"submenu": [5],
"deklarac": [11],
"spr??vce": [[4,6]],
"jin??mi": [[5,6]],
"????et": [5,11],
"p??ejdet": [9],
"uv??d??n??": [2],
"upravujet": [9],
"vnit??n??": [11],
"ulo????": [8,11],
"identick??": [5],
"pravidla": [11,6,10],
"zkr??cen??": [2],
"identick??": [6,[2,11]],
"rozpracovan??": [11],
"zatrhn??t": [8],
"procesoru": [11],
"omegat.jnlp": [5],
"po????t??": [11],
"kl????ov??": [11],
"pravidlo": [11],
"tabulkov??ho": [11],
"identick??": [8,[3,9,10,11]],
"datumem": [11],
"nezapamatuj": [11],
"n.n_windows_without_jre.ex": [5],
"vymezit": [5],
"importov??n??": [6],
"p????kazov??ho": [5,[6,7]],
"net??mov??ho": [6],
"p????li??": [11],
"dole": [11],
"prof": [11],
"n??jakou": [11],
"bidirekcion??ln??ho": [[3,8]],
"n??sledovn??": [[5,11],3],
"p??????in??": [5],
"obchodn??ch": [11],
"dmicrosoft.api.client_id": [5],
"poka??d??": [11,6],
"popul??rn??m": [11],
"p????kaz??": [11,5],
"config-fil": [5],
"segmetnu": [8],
"skryt??": [10],
"ponechat": [11],
"vytv??????": [6],
"zkop??rovat": [[4,6]],
"oblasti": [11],
"????sti": [9],
"koment????em": [[1,3]],
"p??izp??sobit": [11,3],
"zvolt": [5],
"dat": [6,[1,11],[5,7]],
"zp??sobuj": [8],
"t??et??": [1],
"z??mn??m": [10],
"upraven": [5],
"naz??van??": [11],
"system-user-nam": [11],
"dv??ma": [6,[3,5]],
"format": [11],
"u??ivatelskou": [7],
"console.println": [11],
"naz??v??no": [5],
"zkontrolujt": [6,0,4],
"v??b??ru": [5],
"kl????e": [5,11],
"odstran??": [[4,11]],
"hodit": [11,[2,5]],
"dokon????t": [[6,8]],
"zak??zek": [9],
"disku": [6],
"ulo??t": [6,[1,3,5]],
"editoru": [11,9,8,6,[1,5,7,10]],
"aktualizov??na": [5],
"polovin??": [11],
"tabulkov??": [1],
"jazyk??m": [11],
"aktualizovan??": [1],
"existuj??": [11],
"ur??it??ho": [11],
"project_files_show_on_load": [11],
"definuj": [[8,11]],
"ltr": [6],
"optionsexttmxmenuitem": [3],
"p??elo??en??ho": [11,[6,8,9]],
"build": [5],
"p??rovac??": [11,7],
"strojov??": [11,9,8,7],
"nazna??il": [6],
"marketplac": [5],
"kv??li": [6],
"nepot??ebn??": [11],
"arch??v": [0],
"entries.s": [11],
"textov??mi": [11],
"stisk": [[1,3]],
"del": [[9,11]],
"kastil??tinu": [4],
"den": [6],
"mimo": [2,[5,6]],
"gotonextuntranslatedmenuitem": [3],
"zbarvena": [9],
"targetlocal": [11],
"path": [5],
"z??skaj??": [5],
"zkontroluj": [5],
"nakop??rov??ni": [9],
"vy????d??": [11],
"posledn??ho": [[8,10]],
"samotn??": [5],
"nastaven??mi": [11],
"mezer": [11],
"deseti": [8],
"allsegments.tmx": [5],
"odpov??d": [5],
"tich??": [5],
"spojeni": [11],
"shoda": [11,9,1],
"pro??": [5],
"helpcontentsmenuitem": [3],
"omegat-org": [6],
"zkratek": [3,7,2],
"shodi": [8,11,10,9,[2,3],6],
"jak??hokoli": [6],
"??edou": [11,8],
"descript": [5],
"t??emi": [6],
"nejd????v": [6],
"stisk??": [11],
"p??elo??en??m": [11],
"p??smeno": [2,[3,6,8]],
"projectaccessdictionarymenuitem": [3],
"za??krtnuta": [11],
"kl??vesov??": [3],
"p??ru": [6],
"kl??vesov??": [3,1,[6,11]],
"domn??v??t": [6],
"tehdi": [8,11,5,[4,9]],
"pou??ijet": [11,5],
"shodu": [11,9],
"p??smena": [8,3,2],
"n??meck??m": [4],
"za??krtnuto": [11],
"tich??m": [5],
"p??ekl??dan??": [[10,11]],
"term": [1],
"p??ri": [11],
"dol??": [11],
"dosud": [11,8],
"duden": [9],
"obsahuj": [10,[5,11],6,[1,9],0],
"distribuci": [5],
"nahrad??": [[8,11]],
"pr??b????n??": [10],
"samotn??": [[1,6]],
"??ecki": [2],
"spotlight": [5],
"did": [11],
"podr??en??": [3],
"zdroj": [8,3,[6,9,11]],
"podob": [[3,11]],
"nem????et": [9],
"star????ch": [[9,11]],
"????slo": [11,8,5,[3,9]],
"dir": [5],
"slovn??k??m": [4],
"????sle": [1],
"div": [11],
"v????e": [6,11,[5,9],10,[0,1,4,8]],
"????sla": [11,[6,9]],
"velk??": [[2,3,8,11]],
"lze": [6,8,[5,11],1],
"p??ekladov??m": [11],
"poslou????": [11],
"okolo": [11],
"specifika": [11],
"viewfilelistmenuitem": [3],
"zdrojem": [[8,11],6,[3,9]],
"velk??": [8,[2,3]],
"navr??eni": [9],
"rozeznat": [11],
"brows": [5],
"podporov??n": [1],
"glo??????": [11],
"test": [5],
"reportovat": [11],
"termin??lu": [5],
"omegat": [5,6,11,8,10,3,7,4,1,0,[2,9]],
"nep??elo??en??ho": [11],
"rule-bas": [11],
"manu??ln??": [8],
"z??lohovou": [6],
"p??ijmet": [5],
"koncovkou": [6,[9,10]],
"bal????ku": [5],
"popisujem": [11],
"virtual": [11],
"widnow": [5],
"valid??tor": [11],
"console-align": [5],
"webov??": [10],
"koncov??": [11],
"ms-dos": [5],
"p??ekl??d??n??": [[9,10,11]],
"projectopenrecentmenuitem": [3],
"z??skali": [11],
"dle": [6,[4,5],[2,8,9,10,11]],
"prakticki": [[1,11]],
"z??stupn??": [11,5,6],
"p??ech??zen??": [11],
"nakop??rovali": [[6,10]],
"und": [4],
"une": [1],
"up??ednostn??nou": [9],
"p??epnout": [[6,11]],
"bu??t": [6],
"desetinn??mi": [11],
"??eck??": [2],
"editoverwritemachinetranslationmenuitem": [3],
"v??sledc??ch": [11],
"specifikovala": [3],
"rusk??m": [5],
"objev??": [11,[4,5,10]],
"es_es.aff": [4],
"p????mo": [5,11,[2,6,8,9,10]],
"tu??n??m": [[9,11]],
"pojavnem": [1],
"????dic??": [[3,8]],
"projectexitmenuitem": [3],
"z??sk??n??": [[5,11]],
"b????n??mi": [6],
"text": [11,9,8,6,10,[2,3,7]],
"nerozbalen??m": [5],
"odstranit": [11,[3,4,5,6,8]],
"editregisteruntranslatedmenuitem": [3],
"init": [6],
"probl??mi": [8,6,[0,1,7]],
"otev??en": [8,6],
"vzhled": [11],
"po??kozen??": [[1,11]],
"schopna": [11],
"rusk??mi": [5],
"stalo": [11],
"vyu????van??": [11],
"manag": [6],
"spr??vn??": [6,[1,8],[10,11]],
"pokus??": [11,[5,6]],
"zablokov??no": [5],
"pr??vech": [8],
"op??tovn??": [6],
"maco": [5,7],
"field": [5],
"provedena": [[6,8]],
"macu": [5],
"p??ece": [9],
"r??zn??": [11,[5,8,9],[6,10]],
"probl??mu": [5],
"doc": [6],
"provedeno": [5],
"konkr??tn??": [5],
"nap????klad": [11,6,[2,4],[1,5,9],[0,3,8,10]],
"provedeni": [5],
"otev??et": [11,[5,6],[8,10],4],
"status": [[8,10,11]],
"server": [[10,11]],
"pod??vejm": [3],
"zkontrolov": [9],
"p??esouvat": [9],
"paramet": [5],
"z??sk??te": [5],
"znova": [11],
"prvki": [6],
"mac": [3,[2,6]],
"nula": [[2,11]],
"znovu": [6,[8,11],[1,3]],
"um??": [6,1,[9,10,11]],
"p??r??": [11],
"za????n??": [11],
"man": [5],
"map": [6],
"????tu": [5],
"op??tovn??": [6,7],
"may": [[9,11]],
"zkratka": [3,[8,11]],
"konkr??tn??": [11,6,9],
"megabytech": [5],
"konkr??tn??ch": [6],
"smaz??n": [8],
"url": [6,11,[4,5,8]],
"vazbu": [9],
"p??es": [5,11,3,[1,4,8,10]],
"cyklicki": [8],
"p??ed": [11,8,6,[5,10],[1,4,9]],
"m??n??n??": [6],
"zkratki": [3,11,[1,6],8],
"uppercasemenuitem": [3],
"viewmarkuntranslatedsegmentscheckboxmenuitem": [3],
"opera??n??": [[5,11]],
"specifickou": [11],
"zkratku": [[3,6,9,11]],
"form??tov??n??m": [11],
"zp??sobem": [[5,6],[4,9,11]],
"klienta": [6,10,[5,9,11]],
"zajist??t": [11],
"use": [5],
"v??choz??": [3,11,[6,9],[5,8,10]],
"p??esko??it": [11],
"svn.code.sf.net": [5],
"omegat.jar": [5,[6,11]],
"omegat.app": [5],
"neviditeln??": [11],
"usr": [5],
"zobrazen??ho": [11],
"nezobrazuj??": [1,11],
"obsahem": [10],
"bezpe??nost": [11],
"p??rov??n??": [11,8],
"podstat??": [4],
"odkaz": [6],
"v??znam": [11],
"necht": [11],
"utf": [1],
"u??ivatel??": [5,7,11],
"na??ten": [6,[1,11]],
"prvn??": [11,[5,8],[1,3,9,10]],
"servic": [5],
"vypln??n": [[8,11]],
"ov????en??ho": [11],
"p??ekl??dan??": [3],
"spojen??": [11,5],
"slu??eb": [5],
"takov??ho": [6,[9,11]],
"dsl": [0],
"vztahuj??": [[5,6]],
"m??n??": [5],
"mo??n??ch": [[5,11]],
"posledn??ch": [11,6],
"nenalezn": [1],
"dokumentaci": [3,11],
"ko??en": [[3,8,11]],
"rozbalen??": [5],
"n.n_windows_without_jre.zip": [5],
"openoffice.org": [6,11],
"med": [8],
"m??jte": [11,[5,6]],
"pr??b??h": [11],
"instala??n??": [5],
"??lut??": [9],
"tomto": [5,6,[8,10,11],[1,9]],
"make": [11],
"rozbalit": [[0,5]],
"slu??bi": [[5,11]],
"neplat??": [5],
"nach??z??": [5,[1,2,6,8,10,11]],
"pr??b????n??m": [11],
"????sel": [11],
"projectcompilemenuitem": [3],
"console-transl": [5],
"vr??t??": [[5,6,9]],
"slu??ba": [8],
"naviga??n??": [5],
"kreativn??": [11],
"nahrad??t": [9],
"sou??asnosti": [11],
"jednoho": [11,8],
"gotonextuniquemenuitem": [3],
"nasb??rali": [10],
"grafi": [11],
"wordart": [11],
"optionsviewoptionsmenuitem": [3],
"glos????": [1,11,9,3,[7,8],[6,10],[0,4]],
"commit": [6],
"p??ekl??dan??ho": [11],
"targetlocalelcid": [11],
"project_stats_match.txt": [10],
"dva": [11,5,[4,6,8]],
"dvd": [6],
"zad??n??": [11,[2,8]],
"syst??mem": [8],
"xmx2048m": [5],
"v??e": [[1,9,10,11]],
"meniju": [1],
"vyhled??va??i": [11],
"ne-slova": [2],
"xxxxxxxxxxxxxxxx.xxxxxxxxxxxxxxxx.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx": [5],
"ud??lost": [3],
"mexickou": [4],
"koncovek": [11],
"??ipku": [11],
"pozna??it": [11],
"neobsahuj??": [[6,11]],
"jm??na": [11,[6,9]],
"prom??nnou": [11],
"mezern??k": [11],
"dosta??uj??c??": [6],
"probl??m??": [[1,8]],
"krunner": [5],
"libreoffic": [6,4,11],
"postupuj": [11],
"vyu??ijet": [[4,11]],
"kliknut??": [11,8,5],
"zav??en??": [[6,8]],
"nezalomiteln??": [11],
"ovlivn??": [5],
"parsovac??m": [11],
"??asto": [6,11,5],
"podtr??en??": [1],
"nastavovat": [5],
"konceptu": [11],
"specifikovan??": [11],
"jm??no": [11,[5,6]],
"texti": [11,6,[8,10]],
"v????i": [10],
"nejsou": [11,[1,6,10],8],
"implementacemi": [5],
"nepodporuj": [6],
"existuj": [10,[2,8,11]],
"za????tku": [10,[6,11],[3,5,8]],
"naraz??t": [6],
"typick??m": [6],
"defin": [3],
"vy??aduj": [[4,6,11]],
"p??edstavuj": [[5,9,11],[6,7,10]],
"meta-tag??": [11],
"d??v??ryhodn??ch": [11],
"stav": [8],
"maskov??no": [5],
"maj??": [11,5,[4,8,10]],
"??plnou": [6],
"??e??en??": [6],
"po??ad??": [11,8],
"n??kter??": [11],
"viewdisplaysegmentsourcecheckboxmenuitem": [3],
"zav????t": [11,[3,8]],
"klik": [9],
"editregisteremptymenuitem": [3],
"p??izp??soben??": [3,7,[2,11]],
"potvrzuj??c??ho": [11],
"n??kter??": [[0,11],[1,6,8,9]],
"textu": [11,6,4,10,[1,8,9],[3,5,7]],
"dokud": [[6,11]],
"open": [11,6],
"wordovsk??mi": [6],
"otev??enou": [6],
"nesm??": [11],
"www.oracle.com": [5],
"n??kterou": [11],
"skript": [11,[5,8]],
"nesp??rovan??": [[9,11]],
"existov": [5],
"zadan??": [11,5],
"otestujt": [6],
"project": [5,11],
"xmx1024m": [5],
"p??edefinovat": [11],
"zvykem": [8],
"norm??ln??": [11],
"zad??no": [5],
"zdrojov??m": [[10,11],1],
"rozli??uj??": [2],
"m??me": [5],
"ztr??t??": [6],
"nechcet": [11],
"voliteln??": [8,5],
"penalty-xxx": [10],
"ur??ena": [6],
"zad??na": [8],
"gotonextsegmentmenuitem": [3],
"zadan??": [11],
"m??lo": [11],
"zadan??": [11],
"nnn.nnn.nnn.nnn": [5],
"zpracovat": [[5,6,11]],
"rozlo??en??": [11],
"p??ekl??dan??mu": [8],
"kontrolujt": [6],
"abort": [5],
"hodnot": [9],
"ur??eni": [11],
"mal??": [2,[3,8]],
"internet": [11],
"ur??eno": [5],
"kvantifik??tori": [2,7],
"kompon": [11],
"dopl??t": [5],
"dv??": [11,9,5],
"po????ta??i": [5,[8,11]],
"firefoxu": [4],
"????dac??ho": [5],
"li??ta": [9,7],
"v??voj": [2],
"standardn??ho": [9],
"slu??ovat": [11],
"nastaven??ch": [11,8],
"t??eba": [[4,11]],
"li??ti": [9],
"ned??vn??": [[3,8]],
"oper??tori": [[2,7]],
"vybr??n??m": [[10,11]],
"sn??mk??": [11],
"umo??nili": [11],
"p??elo????t": [11],
"es-mx": [4],
"zpracov??vat": [11,[5,6]],
"souborov??": [[6,9]],
"slovn????k??": [1],
"zahrn": [6],
"base": [1],
"exterm??": [8],
"p??ednastaven??ho": [11],
"zajist??": [11],
"jind": [9],
"kurz??vou": [11],
"zajist??": [1],
"moh": [[6,10,11]],
"neplatn??m": [5],
"ztrat??t": [9],
"ur??en??": [1],
"z??stupc??": [5],
"kolekc": [11],
"zadaj??": [5],
"navrhovan??ch": [9],
"okolnost??": [5],
"poda????": [6],
"soubor": [5,6,11,1,8,10,3,0,[7,9]],
"nepot??ebujet": [[5,11]],
"pozici": [8,9,11,[4,6]],
"listopad": [1],
"stisku": [[3,9]],
"repozit????em": [6],
"je??t??": [9],
"existuj??c??": [11,5,6,10],
"uk??zan??": [9],
"gedit": [1],
"p??smo": [3,11],
"jinou": [[4,6,11]],
"sloupc??ch": [11],
"objekt": [11],
"ur??en??": [[4,6]],
"jejich": [11,6,9],
"word": [11,6],
"p??sma": [11,8],
"c??lov??ho": [11,6,[4,9],[1,8]],
"ov????ovat": [1],
"spu??t??n": [5,11],
"uveden??mi": [5],
"brazilsk??": [4],
"u??ivatelova": [5],
"podstatn??": [11],
"zpr??vi": [[6,9]],
"odd??lt": [6],
"poslou??it": [6],
"pbsahuj": [10],
"p????kladem": [6],
"neodpov??daj??": [[1,11]],
"koncovki": [1],
"opera??n??m": [8,5],
"meta-tagi": [11],
"kop??rovat": [[3,8,9]],
"velmi": [11,6],
"posunu": [2],
"koncovka": [[1,11],0],
"zm??n??n??ch": [1],
"neda????": [11],
"nakliknet": [9],
"tomuto": [10,[9,11]],
"extern??": [11,[3,8]],
"fyzicki": [4],
"norm??ln??": [11],
"prost??m": [1],
"koncovku": [[0,1]],
"nebud": [8,[5,11],[1,6],4],
"lingvo": [0],
"spu??t??na": [5],
"mrs": [11],
"text??": [11],
"prom??nn??": [11],
"prost??ednictv??m": [5,6,[0,9,11]],
"??prav??m": [3,8],
"objemu": [11],
"vztahuj??c??ch": [11],
"prom??nn??": [11],
"spu??t??no": [8,11],
"t??hnout": [9],
"multiplatformn??": [11],
"jin??": [6,5,[1,4,10]],
"li??t??": [5],
"dokumentem": [[9,11]],
"osmi??kovou": [2],
"jin??": [6],
"pt_pt.aff": [4],
"html": [11,5],
"nakop??rov??n??": [6],
"up??ednost??ovanou": [11],
"ctime.txt": [11],
"opatrn??": [6],
"????nsk??": [11],
"t????da": [2],
"nemus??t": [[4,5]],
"zastaralou": [6],
"nep??esunet": [11],
"artund": [4],
"t????di": [[2,7]],
"ukon??en??": [9],
"zap??????in??": [11],
"m??te": [5,11,6,4,[1,9]],
"p??id??vat": [11,[9,10]],
"ukon??en??": [8,[3,11]],
"konfigura??n??": [5,8],
"vyskytovat": [11],
"jak??m": [11],
"pot??hnet": [9],
"st??vaj??c??": [[5,6,11]],
"cti.m": [11],
"touto": [5],
"defektn??m": [6],
"postupn??": [[6,11]],
"www.ibm.com": [5],
"vypad??": [5],
"pracovat": [6,[1,5]],
"dot??en??": [6],
"vytv????en??": [11,1],
"po????ta????": [11],
"c??le": [[4,8,11]],
"zadali": [[4,8]],
"ov????it": [[3,6,11]],
"aktualizovat": [[5,11]],
"zprava": [6,[7,8]],
"spu??t??n??": [5],
"ma??ou": [6],
"nebyl": [[1,8]],
"vybranou": [8],
"doporu??ujem": [[1,11]],
"command": [[3,5,9]],
"flexibilit??": [11],
"n.n_without_jr": [5],
"vztahuj": [6],
"pou????v??t": [5,[1,3,6,10]],
"p??i??em??": [9],
"jin??": [[6,9,11]],
"objevovat": [9],
"viewmarkbidicheckboxmenuitem": [3],
"po????ta????ch": [3],
"year": [6],
"povoluj??": [9],
"takov??": [[6,11]],
"ur??en": [5],
"upgradu": [11],
"organizac??": [1],
"detailn??": [5],
"poskytn": [[6,11]],
"polo??ki": [3,11,[1,6],5],
"vyu????v??": [10],
"vykon??vat": [11],
"polo??ka": [3,[1,5],11],
"??daj": [5],
"??ervenou": [10],
"ptev??": [8],
"zobrazen??ch": [11],
"viz": [[6,11],[1,4,5,8,10]],
"konverz": [6],
"polo??ku": [5,[8,9,11]],
"nastaven??mi": [6],
"version": [5],
"mapov??n??": [6,11],
"opakuj??c??ch": [9],
"voln??": [0],
"folder": [5],
"??pan??l??tinou": [4],
"spus??t": [5],
"pot??eb": [6],
"prob??haj??": [9],
"nalzenet": [3],
"zobraz??t": [11,5],
"nastaven": [6],
"znak??": [11,2,[5,6,7],[3,8,9]],
"po??adavkem": [6],
"statistiku": [8,10],
"nakl??d??": [11],
"vytv????ej??": [6],
"pr??m??rn??": [11],
"u????van??ho": [11],
"nijak": [4],
"pot??ebn??m": [5],
"p??esn??": [11,1],
"projecteditmenuitem": [3],
"britannica": [0],
"statistiki": [[6,10]],
"umo????uj??": [8],
"segmentaci": [11],
"wikipedii": [8],
"statistika": [3,8,10,6],
"zapnout": [11],
"jednotkami": [11],
"jak??koliv": [2,11,10],
"vybrali": [4],
"wikipedia": [8],
"machin": [11],
"na??etlo": [3],
"p??esto": [11],
"informac??m": [[0,5]],
"pou??it": [[5,11],1],
"druhou": [11],
"skute??n??": [11],
"stran??": [6],
"norm??ln??ch": [5],
"skupin??": [6],
"n??lez??": [11],
"vlastn??ch": [11,[6,8]],
"anglick??": [6],
"iceni": [6],
"nebo": [11,6,5,2,8,9,1,3,4,10,0],
"jedine??n??": [[9,11]],
"exportuj": [[6,8,11]],
"krokem": [9,10],
"struktur??ln??": [11],
"pou??ij": [[5,11],[4,6]],
"p??esun": [8],
"zvl??dli": [9],
"zv??razn??t": [9],
"d??je": [11],
"docela": [1],
"aktivaci": [8],
"sled": [11],
"kombinaci": [0],
"zv??razn??n??ho": [8],
"p??ibli??n??mu": [8],
"naleznou": [11],
"n??hradn??": [11],
"dsun.java2d.noddraw": [5],
"pam??tech": [[10,11]],
"skupina": [2],
"x0b": [2],
"koment??????ch": [11],
"samotn??m": [[10,11]],
"http": [6,5,11],
"skupini": [[9,11]],
"ukazovat": [[8,11]],
"stranu": [11],
"sn????en??": [10],
"volbami": [8],
"termin??lov??": [5],
"p??ed??lat": [9],
"syntaxi": [11],
"vr??tit": [9,[8,11]],
"voln??": [9],
"tabul??torem": [1,11],
"softwar": [11],
"ov??em": [[3,6,11]],
"spou??t??": [[5,8]],
"upozorn??n??": [11,5],
"odpojit": [9],
"projectsinglecompilemenuitem": [3],
"zadan??ho": [[5,11]],
"vytv????ejt": [6],
"p??rovat": [11,8],
"nejnov??j????": [6],
"zp????stupnit": [3,[8,11]],
"zastoupen??": [11],
"imperativn??": [11],
"velk??m": [[2,11]],
"takov??": [11],
"kupa": [11],
"jako": [11,6,[5,9],8,[1,2],[4,10],0,3],
"dokument.xx": [11],
"v??razech": [11],
"aktualizac": [5,11,[1,8]],
"chov??": [11],
"toho": [5],
"ukl??d??": [[6,8]],
"definovat": [11,[2,5]],
"sctr": [11],
"voln??": [8],
"zv????it": [11],
"takov??": [11,6,[1,9,10]],
"internetov??m": [11],
"skupin": [11],
"nejd": [5],
"m??du": [6],
"form??": [[2,6]],
"prav??m": [9],
"system-os-nam": [11],
"vybran??": [8,[5,9,11]],
"optionstabadvancecheckboxmenuitem": [3],
"nad": [[6,11]],
"????ste??n??": [11],
"v??cekr??t": [2],
"vybran??": [8,11],
"n????e": [[2,5,6,9],[3,4,11]],
"kterou": [[3,9,11]],
"??innosti": [5],
"vybr??na": [8],
"pracovn??m": [5],
"zpracov??van??": [8],
"??tim??": [11],
"p????hodn??m": [5],
"optionsviewoptionsmenuloginitem": [3],
"sb??rce": [9],
"vybran??": [8,[4,6,11]],
"zpracov??v??ni": [[6,11]],
"vybr??no": [[8,11]],
"zelen??m": [9],
"m??di": [6],
"tar.bz2": [0],
"voz??ku": [2],
"nov??ch": [8,[3,6]],
"francouz??tini": [11],
"nejjednodu??????m": [5],
"bundle.properti": [6],
"p??id??lili": [5],
"syst??m": [5,[1,11]],
"x64": [5],
"b????n??": [[5,6,8,11]],
"sestaven??": [5,7],
"dvakr??t": [5],
"pravidl??m": [11],
"francouz??tinu": [11,5],
"hledac??ho": [11],
"hodini": [6],
"vyhrazen??ho": [6],
"????dk??": [11],
"b????n??": [[6,8]],
"ud??lejt": [10],
"isn\'t": [2],
"????dn??": [5,6],
"login": [11],
"bl??????c??ch": [11],
"stejnou": [[5,6,10]],
"??????ili": [6],
"vybran??ch": [[3,6,8]],
"tomu": [[6,11],[5,8,9]],
"d??l??": [5],
"b????n??": [6],
"kliknout": [[5,11]],
"spr??vnost": [[9,11]],
"jak??": [11],
"optionsteammenuitem": [3],
"objektov??ho": [11],
"kl??vesovou": [[3,9,11]],
"gzip": [10],
"nep??elo??en??": [11,8,[3,9]],
"rozhran??": [5],
"tvo??en??": [6],
"sm??ri": [6],
"hled??": [11],
"vid??li": [11],
"esc": [11],
"v??raz": [11,1,[2,5],9],
"x86": [5],
"nep??elo??en??": [11,8,[3,6,10]],
"nastav??": [11],
"stazeny_soubor.tar.gz": [5],
"tvo??en??": [1],
"automatick??m": [[6,11]],
"nostemscor": [11],
"nalezen??m": [9],
"znovuna??ten??": [6],
"odpov??dali": [2],
"??estn??ctkovou": [2],
"te??ka": [2,[5,11]],
"odpov??dalo": [11],
"linki": [11],
"n??kolika": [11,[5,9]],
"te??ki": [11],
"console-createpseudotranslatetmx": [5],
"br??ni": [11],
"vy??????": [[5,11]],
"d??le??it??": [[6,11]],
"??len": [2],
"ur??it": [[5,10,11]],
"longman": [0],
"fuzzyflag": [11],
"ukazuj": [9,[0,2,11]],
"obnovit": [11,[3,9],8],
"merriam": [[0,7,9]],
"merrian": [0],
"fungovat": [[4,8],[6,11]],
"nov??j????": [[5,8]],
"protokol": [[3,8]],
"d??le??it??": [5,6,11],
"soukrom??": [[9,11]],
"st??hnout": [[0,3,8],[4,5,6,7]],
"skute??n??": [5],
"te??ku": [11],
"??et??zc??": [6],
"intervali": [11],
"sestaveni": [6],
"skon??en??": [11],
"origin??ln??ho": [6],
"nastavit": [11,6,[1,5,7,8]],
"exportn??": [6],
"ni??eho": [9],
"vhodn??m": [6],
"odpov??daj??": [11],
"netisknuteln??": [11,8,[1,3]],
"opera??n??ch": [10],
"n.n_without_jre.zip": [5],
"obvykl??": [6],
"zv??t??it": [11],
"netisknuteln??": [11,2],
"logick??": [[2,7]],
"cel??": [[8,11],6,5],
"chyb??j??c??": [8,3],
"obr??zku": [9],
"v??ce": [11,5,6,[9,10],1,7,[3,8]],
"formu": [[10,11]],
"nep??elo??eno": [11],
"potvrdit": [[3,8,11]],
"zn??m??": [6],
"zobrazen??mi": [1],
"braz??lii": [5],
"b????n??ho": [[5,6]],
"obchodn??": [[9,11]],
"anglicki": [6],
"z??rove??": [7],
"zn??m??": [11],
"ru??tin??": [5],
"zadat": [5,11,[1,4]],
"jin??m": [5],
"formi": [10],
"vybrat": [11,[4,9],5,8],
"offlin": [6,5],
"holadski": [6],
"odstra??t": [11],
"u00a": [11],
"cel??": [11],
"nep??elo??eni": [11],
"p??et??hnout": [5,[7,9]],
"selhat": [5],
"toto": [11,5,6,[8,9,10],[1,2,4]],
"voleb": [11],
"nen??": [5,8,[9,11],[1,6],10],
"shift": [3,11,[6,8],1],
"p????kazov??": [5],
"nic": [2,[8,10]],
"plo??e": [5],
"java": [5,3,[2,11],[6,7]],
"p????kazov??": [5],
"exe": [5],
"adres??????ch": [10],
"javi": [[5,11]],
"lang2": [6],
"lang1": [6],
"ukl8daj9": [11],
"ov????en??": [[3,5,6]],
"project_save.tmx": [6,10,11],
"pam??ti": [6,11,[5,10],9,8,[1,2]],
"dictionari": [0,10,7],
"modelu": [11],
"importuj": [9],
"horn??m": [9],
"ozna??t": [11,8,[5,6],4],
"opou??t??n??": [11],
"slov": [11,9,[2,8]],
"operac??ch": [9],
"nem??": [[1,5],[8,11]],
"posl??z": [[4,5,6]],
"vynucen??ch": [10],
"????dku": [5,2,6,11,[3,7,9]],
"vygenerov??n??": [6],
"p??edb????n??mu": [6],
"parametrem": [5],
"p??ev??st": [11,6],
"prav??ho": [11],
"ciz??ch": [11],
"rozestav??n??": [[9,11]],
"????eli": [11,[1,4]],
"zapl??uj??c??": [11],
"chyba": [[5,6]],
"popsan??": [5],
"zvolen??m": [5],
"??time": [5],
"chybi": [6,[5,8]],
"pops??ni": [11],
"timestamp": [11],
"projectaccessrootmenuitem": [3],
"up??ednostn??n??": [11],
"dyandex.api.key": [5],
"pops??no": [[8,11]],
"vyps??no": [[5,9]],
"doprava": [6],
"nezapome??t": [11,[4,6,10]],
"konfigurovat": [11],
"u??et????": [11],
"jazyc": [[5,9],[1,6,10]],
"p??i??azen??": [5],
"vedlej????": [10],
"p??edchoz??ch": [9],
"p??i??azen??": [3],
"ofici??ln??": [7],
"provozu": [5],
"plugin": [11],
"prezentaci": [11],
"v??di": [11,[1,3,8,9]],
"jazyk": [5,11,6,4,1],
"??inili": [6],
"n??jak??ho": [[2,11]],
"libovoln??": [10],
"mo??nost??": [11,5,[6,9]],
"????dki": [5,3,11],
"microsoff": [11],
"neprojev??": [5],
"vte??in": [11],
"editinsertsourcemenuitem": [3],
"ukon????": [8],
"ozna????": [8],
"microsoft": [11,[1,5,6,9]],
"projectnewmenuitem": [3],
"spoustu": [11],
"opera??n??ho": [[5,11]],
"nab??zej??": [6],
"prav??m": [[5,9,11],1,[4,8]],
"dispozici": [5,4,[8,11],[1,3]],
"optionstranstipsenablemenuitem": [3],
"segment": [8,11,9,3,10,6],
"nab??zeno": [9],
"cifern??": [6],
"spousti": [[10,11]],
"glossari": [1,[6,10],[7,9,11]],
"ulo??it": [11,8,[3,5,6,9]],
"ignored_words.txt": [10],
"navr??t??": [11],
"ne??": [11,6,[2,4,5,8,10]],
"configuration.properti": [5],
"github.com": [6],
"ukl??d??n??m": [11],
"p??eb??raj??": [6],
"nnn": [9],
"next": [[0,1,2,4,5,6,7,8,9,10,11]],
"vygenerov??ni": [11],
"rozli??ovat": [[10,11]],
"????ste??n??": [9],
"string": [5],
"import": [6,11],
"slou??it": [4],
"vizu??ln??": [8],
"m??stn??mi": [11],
"ur??ov??no": [1],
"obousm??rn??ho": [8],
"t??mov??": [[6,8],[5,11]],
"p??ep??n??n??": [[6,8]],
"not": [11,5],
"volbu": [[8,11]],
"jednor??zov??": [3],
"nep??ekl??dat": [11],
"????dn??": [8,11,[1,5,9]],
"??vodn??": [11],
"t??mov??": [6,8,[3,7]],
"volba": [[8,11],4],
"kurzoru": [8,[9,11]],
"klos????": [11],
"spousta": [6],
"volbi": [[5,9,11]],
"was": [11],
"selection.txt": [11,8],
"editovat": [11,9],
"jednoduch??m": [6],
"xhtml": [11],
"deklaraci": [11],
"????dn??": [11,5,[1,10],[3,8]],
"refer": [9],
"mo??nosti": [11,8,[3,5,9],6,[4,7],[2,10]],
"????dn??": [11,[8,10]],
"window": [5,[0,1,2,7,8]],
"doc??lit": [[6,9]],
"m??dium": [6],
"zp??tn??ho": [[2,5]],
"umo????uj": [11,[5,6],[1,2,8,9]],
"p??ejmenujt": [6],
"aktivn??ho": [[8,10,11]],
"????dek": [5,[3,8,11],2],
"vstupn??": [[6,11]],
"kombinac": [3],
"disable-project-lock": [5],
"spodn??m": [11],
"kdy??": [11,[5,6,8],9,1,[4,10]],
"omegat.pref": [11],
"ud??l??t": [5],
"siln??": [11],
"naraz??": [11],
"ozna????t": [8,[1,5]],
"nab??zen??": [8],
"exportovateln??": [6],
"znaki": [11,8,1,[2,3,5,6,9]],
"zdrojov??m": [11,9,[1,3,5,8,10]],
"p??edchoz??mi": [11],
"podm??nek": [[0,6,10]],
"p??edchoz??mu": [[2,6]],
"licenc??": [[0,6]],
"cel??ch": [11],
"pt_pt.dic": [4],
"stisknet": [11,[8,9]],
"thunderbirdu": [4],
"netisknuteln??ch": [11],
"radu": [6],
"level1": [6],
"znaku": [11,[2,5]],
"ulo??en": [6,[9,11]],
"instrukc": [5,11],
"level2": [6],
"vedl": [11,5,[1,3,4]],
"p??idejt": [[3,5,6,11]],
"pokyni": [[7,11]],
"soused??c??": [9],
"nahr??t": [11],
"za??krtn??t": [11],
"vzhledem": [11],
"web": [5,7],
"en-us_de_project": [6],
"nahr??n": [1],
"s??m": [11],
"kativujt": [10],
"levelu": [6],
"p????pon??": [11],
"editselectfuzzy4menuitem": [3],
"editregisteridenticalmenuitem": [3],
"jak??koliv": [3],
"rozbalen??m": [5],
"dialogov??m": [[8,11],6,[1,10]],
"procesor": [1],
"schr??nki": [8],
"b??l??ho": [2],
"programech": [[4,11]],
"k??dem": [4],
"t??m????": [1],
"nespolehliv??": [1],
"pt_br.dic": [4],
"nastavov??n??": [1],
"mexick??": [4],
"tabulc": [11],
"unabridg": [0],
"chyb??t": [1],
"p??esn??": [1],
"p??edchoz??ho": [[6,8]],
"automatick??m": [11],
"muset": [11,6],
"z??pis": [11],
"pam??t??": [6,10,11,[7,9],5],
"optionsglossaryexactmatchcheckboxmenuitem": [3],
"ohrani??eni": [1],
"vylep??en??": [[8,11]],
"p??esn??": [11,8],
"komponenti": [6],
"po??izujt": [6],
"rozbalovac??ho": [11],
"zelen??m": [8],
"jezdec": [11],
"p????poni": [11],
"u????v??": [[2,4]],
"chyb??li": [8],
"zn??zornit": [11],
"cht??t": [11,[5,6]],
"nnnn": [9,5],
"project_save.tmx.yearmmddhhnn.bak": [6],
"form??tech": [11],
"oknech": [5],
"doslovn??ch": [11],
"d??vk??ch": [5],
"importovat": [11,[6,10]],
"slovn??kov??": [4],
"hotovu": [11],
"lev??m": [11],
"v??te": [11],
"br.aff": [4],
"u????v??n??m": [6],
"zh_cn.tmx": [6],
"zkracuj": [11],
"objektov??": [11],
"v??znami": [9,7],
"p??i??azeno": [5],
"vyu????t": [11],
"zhruba": [9],
"doporu??eno": [11],
"funguj": [11,8],
"archiv": [5],
"bal????ek": [8,5],
"p??i??azena": [3],
"repo_for_omegat_team_project.git": [6],
"podobnosti": [11],
"v??stup": [[6,11],[3,8]],
"p??ekladatelem": [6],
"nab??dki": [3,11,9,5,[6,8]],
"proxi": [5,11,3],
"p??ekr??vat": [9],
"synchronizac": [11],
"extens": [11],
"odzna??en??m": [11],
"jedno": [6],
"uplatn??": [11],
"jednu": [11,3,[5,6]],
"nab??dku": [11],
"zapo??et??": [11],
"rozhodnut??": [10],
"ctime": [11],
"pochybnosti": [10],
"z??st??vaj??": [5],
"exportn??ch": [6],
"aplikac": [5,6,4,11],
"nebudou": [11,[3,5,6,8,10]],
"sure": [11],
"parametr": [5],
"p??ep????": [8],
"zv??razn??na": [8],
"kolem": [11],
"sou????st": [[4,5]],
"diff": [11],
"maz??n??": [11],
"an": [2],
"editmultiplealtern": [3],
"optick??": [6],
"zv??razn??no": [8],
"nem????": [[6,11]],
"vid??t": [9,[6,10,11]],
"t????dit": [11],
"be": [11],
"v??skyt": [[2,9]],
"pozn??mkou": [8],
"filters.xml": [6,[10,11]],
"nutno": [6,11,[3,5],[1,4]],
"instalaci": [5,[4,7,9]],
"terminologii": [[1,6,11]],
"slou????c??mu": [6],
"br": [11,5],
"pojmenov??n": [3],
"pat??i??n??ho": [5],
"aktu??ln??ho": [11,9,[1,3]],
"by": [11,6,[0,5],[3,9]],
"segmentation.conf": [6,[5,10,11]],
"kladen": [10],
"panel": [5],
"ve??ker??ho": [9],
"ca": [5],
"souvisej??c??": [9],
"cd": [5,6],
"??????qw??": [11],
"p??ebyte??n??ch": [11],
"p????pad": [6],
"sezen??mi": [11],
"cn": [5],
"co": [6,11,5,[2,10]],
"zm??n??n??": [6],
"figur": [[1,4],[0,2,7]],
"n??vrh": [[9,11]],
"p??edstavuj??": [6,[1,9,11]],
"cx": [2],
"ne-mezera": [2],
"zm??n??n??": [[0,6,11]],
"nab??dka": [3,7,8,[9,11],5],
"bal??k": [5],
"jedn??": [5,[6,11]],
"poskytkuj": [5],
"apach": [4,[6,11]],
"star??ch": [11],
"adjustedscor": [11],
"platn??": [[5,11]],
"dd": [6],
"p??ekladatel": [6,9,11,10],
"jedn??": [11,10],
"ohro??en??": [6],
"vkl??d??n??": [11,6],
"c??lov??ch": [11,6,5],
"do": [6,11,[5,8],9,10,1,4,3,0],
"f1": [3],
"modr??m": [11],
"f2": [9,[5,11]],
"f3": [[3,8]],
"dr": [11],
"tla????tkem": [11,[5,9],1,[4,8]],
"f5": [3],
"obdobu": [5],
"pravideln??": [6],
"jsme": [1],
"funguj??": [6],
"??pln??": [6],
"platn??": [11],
"dz": [0],
"editundomenuitem": [3],
"p??evedeno": [11],
"startuj": [5],
"zkratkami": [3],
"vyhled??vat": [[4,11]],
"u000a": [2],
"indikov??ni": [8],
"koliv": [9],
"zaktivov??na": [8],
"prot??": [11],
"en": [5],
"typick??": [10],
"u000d": [2],
"spr??v??": [6,1],
"u000c": [2],
"eu": [8],
"zna??kami": [11],
"pou????v??": [11,6,5,[1,4,8,9]],
"detailn??j????": [11],
"zv??razn??n??": [[4,9]],
"kolik": [[8,9,11]],
"pozv??nku": [6],
"u001b": [2],
"stats.txt": [10],
"terminologi??": [8],
"terminologi": [11,[1,8,9]],
"sch??ma": [11],
"foo": [11],
"exclud": [6],
"for": [11,8],
"zv??razn??n??": [11],
"pamatuj": [8],
"testov??n??": [2,7],
"doporu??ov??no": [1],
"fr": [5,[4,11]],
"nutn??": [[5,6,11],4],
"content": [5,7],
"desetini": [11],
"specializovan??": [9],
"desktop": [5],
"applescript": [5],
"zapot??eb??": [6],
"gb": [5],
"identifikac": [[8,11]],
"class": [11],
"jsou": [11,5,6,1,10,[0,8],3,9,4,[2,7]],
"helplogmenuitem": [3],
"t??mto": [[5,8,9,11],4],
"imunn??": [10],
"sv??ho": [5,[1,3,4]],
"editoverwritetranslationmenuitem": [3],
"d????ve": [6,[8,11]],
"sest??v??": [9],
"zdrojov??ho": [11,6,5,[8,9,10],[1,3,7]],
"aeiou": [2],
"oba": [6,[10,11],[4,5]],
"prioritn??": [1,7],
"zm??n??no": [6],
"nenalezen": [5],
"t??chto": [11,[5,10]],
"form": [5],
"nechat": [[5,11]],
"d??": [9],
"zazna??ena": [11],
"verz": [5,8,[6,10]],
"hh": [6],
"hlavi??ka": [11],
"pozn??mki": [11,9,7],
"jednom": [[1,3,5,8,11]],
"pos??lat": [11],
"algoritmus": [3],
"duser.languag": [5],
"vestav??nou": [[4,11]],
"plnou": [11],
"programovac??": [11],
"ho": [5],
"pozn??mka": [11,8,[1,3,9,10],[5,6]],
"na??em": [6],
"nastavena": [11],
"jednou": [2,6],
"pln??": [6],
"nastaveni": [6],
"file-target-encod": [11],
"legislativa": [6],
"p??ekl??dan??m": [9,1],
"p??ibli??n??": [3,8,9,[10,11]],
"context": [9],
"vzd??len??m": [6],
"po????tejt": [6],
"https": [6,[5,11]],
"nastaveno": [[10,11]],
"id": [11],
"if": [11],
"project_stats.txt": [11],
"detailn??ho": [11],
"ocr": [[6,11]],
"projectaccesscurrenttargetdocumentmenuitem": [3],
"a??": [[9,10]],
"p??ibli??n??": [11],
"in": [11],
"ip": [5],
"na????t??": [1],
"is": [2],
"identifikaci": [5],
"it": [[1,11]],
"encyklopedi": [0],
"p??ibli??n??": [11,8,9,[6,7],10],
"prvn??mu": [[2,11]],
"zaps??n": [6,8],
"odf": [[6,11]],
"slovin??tina": [1],
"pohybuj": [11],
"odg": [6],
"hlavi??ku": [11,8],
"ja": [5],
"multiterm": [1],
"sd??l??": [6],
"je": [11,5,6,8,9,10,1,4,3,2,0],
"a??": [11,2,[1,4,5]],
"odt": [6,11],
"nepou????vali": [11],
"ji": [[5,6],[8,9,11]],
"gotonexttranslatedmenuitem": [3],
"nplural": [11],
"d??vod": [5],
"js": [11],
"jste": [5,[4,6],[8,9],10,[0,1,3,11]],
"segmentovat": [11],
"p??eddefinovan??": [11],
"zobrazovat": [3,[8,11],[5,6]],
"p??eklad??m": [11],
"learned_words.txt": [10],
"vpisujet": [9],
"p??eddefinovan??": [[2,7,11]],
"mohou": [11,[1,5,6,10],[2,8,9]],
"vyskytn": [11],
"ke": [[5,6],11,[1,10]],
"abyst": [[6,11],[5,10]],
"rozd??ki": [6],
"p??eklada??": [5],
"m??stn??ho": [6,11],
"??t??te": [5],
"ftp": [11],
"rozli??nou": [11],
"viewdisplaymodificationinfoallradiobuttonmenuitem": [3],
"ku": [11],
"draw": [6],
"pout??ebujet": [6],
"specifikujt": [11],
"zru??en??": [11],
"starou": [5],
"nepatrn??": [11],
"????dan??": [11],
"p??ekladem": [[9,11],8,[1,3]],
"le": [1],
"p??ibli??n??": [10,11],
"rozd??li": [11],
"dswing.aatext": [5],
"zvolena": [5],
"projektov??ch": [6,8],
"sp??rov??ni": [11],
"vyobrazen": [4],
"pohledu": [9],
"prahem": [11],
"slovn??k??": [4,7,[0,9,11]],
"lu": [2],
"ne-????slic": [2],
"p??et??hn??t": [5],
"povol??": [5],
"skripti": [11,8],
"cycleswitchcasemenuitem": [3],
"mb": [5],
"na????st": [[3,8,11]],
"omegat.png": [5],
"pokl??d??na": [11],
"editac": [9,[8,11],[3,10]],
"mm": [6],
"lev??m": [11],
"entri": [11],
"uvozov??n??": [[2,7]],
"platit": [5],
"francouzsk??m": [5],
"linuxov??": [9],
"mr": [11],
"ms": [11],
"mt": [10],
"mu": [6],
"ob??": [[5,11]],
"my": [5],
"uskute??n??na": [11],
"disk": [[5,8]],
"na": [11,5,6,8,9,10,4,3,1,0,2,7],
"uvedeni": [[3,8]],
"p??evzal": [11],
"prov??d??n??": [[6,11]],
"uvedeno": [6],
"ne": [11,[5,6],2,[4,10]],
"nastaven??m": [[5,11]],
"vypo????tan??": [11],
"uvozuj": [2],
"p??edem": [11],
"nl": [6],
"situac??m": [10],
"nn": [6],
"datum": [11],
"??ad??": [10],
"nesp??rovan??ch": [11],
"no": [11],
"umist??n??": [5],
"instalac": [5,4,7,8],
"zvolen??": [6],
"m??s??ce": [6],
"gotohistoryforwardmenuitem": [3],
"ur??uj??c??": [5],
"na??t": [8],
"s????": [5],
"prvn??ho": [11,1],
"nemus??": [[1,11]],
"dialog": [[1,11]],
"znalosti": [6],
"od": [11,5,6,[1,3],9],
"of": [7,5,0],
"umo??n??": [11,8,[1,6]],
"li????": [5],
"ok": [[5,8]],
"za??krt??vac??": [11,4],
"jednoduch??ch": [11],
"prov??d??t": [6,11],
"or": [9],
"zm??n??m": [[10,11]],
"os": [[6,11]],
"hodnotou": [2,10],
"akceptov??n": [10],
"tud????": [6],
"z??stupn??ch": [11,6],
"editinserttranslationmenuitem": [3],
"reagovat": [9],
"sp??rov??n??": [11],
"pc": [5],
"formou": [8],
"p??eklada????m": [11],
"uveden": [[5,9]],
"hranic": [2,7],
"po": [11,[2,5,6,9],1,[8,10]],
"pops??n": [5],
"optionsglossarystemmingcheckboxmenuitem": [3],
"neum??": [6],
"pt": [[4,5]],
"sb??rka": [[1,2,9]],
"uveden??": [5],
"s??ijet": [5],
"definov??n??": [11],
"souhrnu": [11],
"m??": [11,5,[6,10],[4,8]],
"vezm": [5],
"manu??lech": [6],
"m??": [5],
"sebe": [1,[5,11]],
"restartujt": [3],
"form??tem": [6],
"edit": [[5,8]],
"uveden??": [11],
"editselectfuzzy5menuitem": [3],
"konfiguracnim-souborum": [5],
"cht??li": [[2,3]],
"p??istupovat": [[0,5]],
"p????kazovou": [5],
"v????m": [5],
"spou??t??c??m": [5],
"includ": [6],
"prohled??vat": [11],
"generov??ni": [10],
"n??sleduj": [11],
"n??": [1],
"minut": [6,8],
"n??kolikr??t": [11],
"pou??it??m": [11,8,[9,10]],
"takov??mto": [9],
"sv??j": [5,[6,8]],
"povolit": [11,[3,5,8]],
"nep??id??": [[6,10]],
"doporu??it": [6],
"dan??ho": [[5,11]],
"sc": [2],
"fr??zi": [11],
"se": [11,[5,6],8,9,1,10,4,2,[0,3],7],
"na??ten??": [[1,6,8,11]],
"fr??ze": [11],
"si": [5,11,6,4,1,0,[9,10],[2,3,8]],
"zad??": [5],
"interv": [11,[6,8]],
"dodan??": [11],
"ta": [11],
"editoverwritesourcemenuitem": [3],
"odpojili": [11],
"b????nou": [[5,10,11]],
"zdarma": [5],
"enforc": [10],
"tj": [11,[1,4,6],[0,5,8,9]],
"remov": [5],
"rezervuj": [5],
"skriptu": [[5,11],8],
"tm": [10,6,11,8,[7,9]],
"to": [11,5,6,9,8,[1,4,10],[0,2],7],
"v2": [5],
"p??ruj??": [11],
"tu": [11,[0,1]],
"tw": [5],
"z??lohuj": [6],
"nalezeni": [[9,11]],
"definov??na": [[10,11]],
"adres????i": [5,11,10,8,6,1,0],
"ty": [11,[5,6,8]],
"skript??": [[8,11]],
"dialogu": [10],
"nalezeno": [1],
"um??st??n??ch": [11],
"definov??ni": [[8,11]],
"viewmarkautopopulatedcheckboxmenuitem": [3],
"kr??t": [8],
"??daj??": [11],
"slovn??ku": [4,[1,11]],
"projectwikiimportmenuitem": [3],
"edita??n??": [9],
"kl??vesnic": [9],
"countri": [5],
"definov??no": [[6,11]],
"regul??rn??mu": [11],
"dokon??ili": [6],
"dodan??": [10],
"dali": [11],
"libovolnou": [10],
"nekoresponduj??c??": [11],
"takov??m": [[6,11],[5,9,10]],
"un": [1],
"nap????ou": [8],
"nalezena": [[1,6,11]],
"up": [11],
"nastaven??": [11,5,8,4,[3,6],[9,10],7,[1,2]],
"st??vaj??ch??ho": [8],
"ut": [11],
"p??i": [11,[5,6],8,[2,4],[1,10]],
"definovan??": [5],
"najdet": [[6,11],9,8],
"zazipovan??": [5],
"??e": [11,5,6,[1,9,10],4,[0,3]],
"this": [[2,5]],
"nev??hejt": [6],
"ka??d??mu": [11],
"ve": [11,5,8,6,9,1,4,10,2,[0,3]],
"obsahovalo": [11],
"zakl??daj??c??": [5],
"vi": [5],
"uvozovkami": [1],
"prohl????e??i": [[5,8]],
"uv??domili": [4],
"slovn??ki": [0,4,7,[6,10,11],[1,8,9]],
"generov??n??": [[10,11]],
"definovan??": [3],
"vs": [9,11],
"upravili": [3],
"logick??ch": [11],
"vy": [[4,11]],
"pojmem": [1],
"zru??ena": [8],
"rozhodnet": [11],
"????rkou": [11,[1,2]],
"pamatovat": [6],
"zobrazili": [5],
"licenc": [8],
"groovy.codehaus.org": [11],
"str??nk??ch": [11],
"repo_for_omegat_team_project": [6],
"zru??t": [11],
"????k??": [6],
"backspac": [11],
"detaili": [[5,8]],
"slovn??ho": [11],
"??et??zec": [11,8,9],
"stromov??": [10],
"emac": [5],
"org": [6],
"distribut": [5],
"????m": [11],
"xf": [5],
"rozbalovac??": [11],
"produktivitu": [11],
"glos??????": [1],
"dovoluj": [5],
"odm??tla": [6],
"zru??eno": [11],
"t??": [6,5],
"pozn??mku": [11],
"jeden": [11,8,9,1,[0,6,10]],
"b??t": [11,1,5,6,3,10,[0,4,9]],
"stromov??": [10],
"xx": [5,11],
"v??b??r": [8,11,3,[0,5]],
"xy": [2],
"va??eho": [6,[4,5,9],11],
"sourc": [6,11,10,[5,8],[7,9]],
"nalezen??": [[1,11]],
"riziko": [1],
"nezm??n??": [11],
"z??stanou": [11,[5,10]],
"d??le": [5,11],
"nalezen??": [5,3],
"typi": [11,[6,8,10]],
"odstavc??": [11,8],
"type": [6],
"speci??ln??": [11],
"slou????c??ho": [6],
"dan??mu": [11],
"hledej": [2],
"toolssinglevalidatetagsmenuitem": [3],
"pustit": [6],
"spr??vu": [6,1],
"p??ruje": [5],
"vypo????t??v??na": [9],
"nalezen??": [[9,11]],
"projectaccesssourcemenuitem": [3],
"psan??": [11,[5,8]],
"yy": [9,11],
"zatrhnut??": [11],
"stavov??": [[5,9]],
"obsahi": [[5,10]],
"za": [11,5,[6,9],4,[1,2,3]],
"jedine??n??ch": [11,9],
"stavov??": [9,7],
"obsahu": [[1,6,8,11]],
"umo??n??t": [9],
"spr??vn??m": [[0,5]],
"ze": [11,6,5,[7,8,9,10]],
"japon??tinu": [11],
"push": [6],
"zh": [6],
"readme_tr.txt": [6],
"penalti": [10],
"japonsk??": [11],
"nalezen??": [[1,11]],
"st??hn??te": [5,0],
"t??mi": [2],
"japonsk??": [11],
"exportujet": [11],
"zpracov??van??ho": [10],
"repozit????i": [6],
"nav??c": [[1,2,5,8,9]],
"rychl??ho": [5],
"utf8": [1,[8,11]],
"sn????eni": [10],
"postupuj??": [2],
"vytvo??ni": [8],
"jednak": [9],
"sn????ena": [10],
"pr??b??hu": [[1,10,11]],
"ujist??t": [5,[1,4]],
"dan??": [[8,10],9],
"jednat": [0],
"dark": [11],
"naleznem": [3],
"kompletaci": [11],
"proch??z??": [11],
"power": [11],
"dan??": [11,[1,6]],
"naleznet": [[5,10,11],8],
"n??pov??d??": [6],
"vyhled??vac??ho": [11],
"tag-valid": [5],
"jednotliv??mi": [1],
"v??etn??": [11,[2,8,9]],
"spust??": [5,11],
"nal??zt": [6],
"jak??ho": [9],
"rad??ji": [1],
"kdekoliv": [10,[4,5,11]],
"zpracuj": [[5,11]],
"aplikaci": [5,6,11,[8,10],[0,1,2,3,4,7]],
"u0009": [2],
"xhh": [2],
"revis": [[0,6]],
"u0007": [2],
"typu": [11,6,0,[5,8]],
"repositori": [6,10,7],
"k??d": [3,11,4,5],
"minimum": [11],
"n??sledn??": [11],
"nab??dc": [11,3,8],
"zase": [11],
"??daje": [11,6],
"v??konn??": [11],
"n??pov??da": [[3,7],8],
"zp????stupn??": [[5,11]],
"data": [11,6],
"lowercasemenuitem": [3],
"snadno": [11],
"wiki": [0],
"firefox": [11,[2,4]],
"zpomalen??m": [6],
"adres??????": [11,8],
"importovan??ch": [6],
"n??pov??di": [6],
"p??eta??en??": [9],
"jedine??n??": [[3,9,11]],
"vlo??il": [11],
"hledat": [11,8,[3,7]],
"obsahuj??c??ch": [11],
"vlo??it": [11,[3,8],9,10,[1,6]],
"????st": [6],
"dan??": [11,10,8,[1,5,6,9]],
"sens": [11],
"va??emu": [5],
"u??": [11,9,[1,5,6,10]],
"kurzor": [11,[8,9]],
"chybov??": [5,6],
"takt????": [6],
"nepoch??zej??c??ch": [11],
"s??t??": [6],
"proto": [[1,6,10]],
"openoffic": [4,11],
"proti": [6],
"svou": [[6,11]],
"volbou": [11],
"prost??edki": [1],
"note": [2,9],
"japon??tin??": [5],
"form??tovan??ho": [6],
"optionsautocompletechartablemenuitem": [3],
"line": [5],
"minimalizov??na": [9],
"vhodn??": [5,4,[6,11]],
"potvrzov??n??": [10],
"serveru": [6,5,11],
"exportov??na": [11],
"regul??rn??ch": [2,11,7,5],
"p??ep??nat": [6],
"kapit??lki": [3],
"zobraz??": [11,8,[4,5,9]],
"git": [6,10],
"vzhledu": [9],
"p??eneseni": [6],
"reprezentuj": [11],
"zato": [1],
"prosp????n??": [11],
"na??teni": [5],
"vhodn??": [[4,11]],
"xx-yy": [11],
"zvol??t": [[1,11]],
"tla????tko": [11,5],
"will": [5],
"povolena": [11],
"detail??": [[6,8]],
"virgul": [1],
"venku": [9],
"glos????i": [1,9,[7,11]],
"tla????tka": [11,[7,9]],
"neovlivn??": [6],
"follow": [6],
"cht??j??": [2],
"povoleni": [11],
"efektu": [11],
"optionsspellcheckmenuitem": [3],
"slou????c??ch": [6],
"nehod??": [[8,9]],
"postupujt": [[0,5]],
"exportovan??": [8],
"nab??dn": [5],
"aktu??ln??mu": [[8,10,11]],
"prom??nn??ch": [11],
"tyto": [11,6,4,5,[8,9,10],1],
"voln??ch": [[4,11]],
"jedna": [11,[2,5,6]],
"optionssetupfilefiltersmenuitem": [3],
"aplikac??": [6,4],
"rozsah": [2],
"altgraph": [3],
"????el??m": [11],
"p??edev????m": [[2,6]],
"budu": [4],
"vlo??en": [8,9],
"podporovan??": [11],
"hled??t": [11],
"zahrnuti": [11],
"nainstalovat": [0,7],
"aktivovali": [9],
"hned": [[1,8,11]],
"xml": [11,1],
"zkop??rov??n": [[8,9,11]],
"adres": [5],
"zahrnuta": [[6,11]],
"kl??vesnici": [[3,11]],
"??pravu": [[8,11]],
"??pravi": [11,6],
"??prava": [11],
"p??ejmenov??n??": [11],
"projd??t": [2],
"podporov??ni": [11],
"spust??t": [5],
"befor": [5],
"podporovan??": [[6,8]],
"vztahuj??c??": [[9,11]],
"bude": [11,5,6,[8,9],[1,10],4,2,3],
"tar.bz": [0],
"kolidovat": [5,3],
"vytvo??it": [11,8,3,[1,5],[6,9],[7,10]],
"po??adavki": [8],
"op??tovn??mu": [6],
"chyb??j??c??mi": [9],
"zdvojen??": [2],
"linuxu": [5,[1,7]],
"za??len??n??": [5],
"odpoj??": [9],
"finder.xm": [11],
"zapsan??ho": [4],
"pozad??m": [8],
"term??ni": [1],
"odpov??dat": [2,[4,11]],
"kontext": [[9,11]],
"xlsx": [11],
"duplicitn??ch": [11],
"pr??va": [5],
"spou??t??c??": [5],
"vysv??tlen??": [5],
"assembledist": [5],
"vyhodnocuj??": [11],
"form??tov??n??": [6,11,10],
"jednotki": [11],
"prohled??v??n??": [2],
"form??ti": [6,[8,11],9],
"typ??": [6],
"pr??vi": [5],
"jednotka": [10],
"formul????": [5],
"prav??": [9],
"m????e": [10],
"odstupech": [6],
"sloupci": [11,8],
"target.txt": [11],
"form??tu": [[6,11],1,0,[5,8]],
"standard": [1],
"nahoru": [11],
"odli??n??": [11],
"tu??n??": [11,[1,9]],
"aktu??ln??": [8,11,[5,6,9],[3,10]],
"p??ekladov??mi": [[10,11]],
"zobrazovac??ch": [6],
"nov??": [8,[5,11],[1,3],2],
"p??id??n??m": [[1,10]],
"nanejv????": [3],
"kontrolu": [11,4,[6,8]],
"zahrnut??": [6],
"otev??": [8,11,9,[1,4]],
"z??stat": [11,10,[5,6]],
"detekuj": [[1,5]],
"t??m": [6,11,8,[4,9]],
"odli??n??": [11],
"nameon": [11],
"optionsglossarytbxdisplaycontextcheckboxmenuitem": [3],
"kontroli": [4,7,11,8],
"pak": [11,8,6,10,[5,9],4,3,1],
"rychlej????": [1],
"odli??n??": [9],
"nov??": [5,[3,11]],
"gotonextnotemenuitem": [3],
"tar.gz": [5],
"gpl": [0],
"kontrola": [4,[2,10,11],[1,3,6,7]],
"omega.project": [[5,9,11]],
"odli??n??": [11],
"sloupec": [1,8],
"pr??v??": [8,10,[9,11],5],
"specifikov??n": [6],
"stran??ch": [6],
"sma??e": [8],
"ukon??en??m": [11],
"pokusit": [11],
"pravopisu": [4,11,7,10,[1,2,3,8]],
"list": [7],
"deaktivov??no": [8],
"b????n??m": [5],
"upravovan??m": [8],
"lisa": [1],
"p??ejmenov??na": [6],
"pon??kud": [5],
"sma??t": [[6,9]],
"azur": [5],
"ka??d??m": [6,11],
"kl??vesov??ch": [3,7,2],
"dynamick??": [11],
"odstran??n??m": [[9,11]],
"c??l": [[8,11]],
"pot??ebujt": [6],
"otev??r??": [[1,8]],
"nab??z??": [11,[1,8,9]],
"souborov??m": [11],
"hled??n??": [11,8,2,[1,5]],
"portugal??tina": [4],
"rozpozn??n??": [6],
"nov??": [[1,11],8],
"odstavec": [11],
"portugal??tini": [5],
"stru??n??ho": [5],
"slo??c": [[5,11]],
"vkl??dat": [6,[1,11]],
"slova": [11,9,8,2,1,[4,5,10]],
"slovo": [11,[1,8],[4,5,9]],
"n??vrat": [9],
"slovi": [[6,11]],
"mrtv??": [6],
"with": [6,5],
"slovu": [1],
"ovl??d??t": [6],
"pdf": [6,[7,8,11]],
"smaz??n??m": [11,10],
"p??id??lt": [6],
"zazna????t": [5],
"nov??": [[6,11],8,[3,4],1,[5,9]],
"vyb??rat": [11],
"u??ivatel": [11,5,8,[2,3,9]],
"zachov??na": [[5,10]],
"lokalizov??na": [5],
"takov??mi": [10],
"vlastnostech": [11],
"toolsshowstatisticsmatchesmenuitem": [3],
"spou??t??n??": [5,7],
"neulo??ili": [8],
"??ty??i": [8],
"u??ivatelsk??": [[5,6],[9,11]],
"stiskn??t": [11,9,1],
"viewdisplaymodificationinfononeradiobuttonmenuitem": [3],
"zachovan??": [10],
"desir": [5],
"zachov??ni": [11],
"proto??": [11,5,[1,6,9]],
"v??t??inu": [11],
"maximalizac": [9],
"??irokou": [[4,11]],
"repozit????": [6,8,5],
"popisovat": [6],
"u??ivatelsk??": [[5,11]],
"zm??n": [6,11],
"dos??hnout": [5],
"p??epsat": [11,[3,8]],
"t????": [[1,5]],
"za????naj??c??": [11],
"sta????": [5,[9,10,11]],
"neodpov??d??": [8],
"textem": [11,10,6,[1,9]],
"u??ivatelsk??": [7,[3,5,8]],
"zav??": [8,11],
"projectaccesswriteableglossarymenuitem": [3],
"p??eved": [8],
"synchronizuj??": [6],
"novou": [11,5],
"vhledem": [9],
"gui": [5],
"n??vrhi": [11,[3,8,9,10]],
"v??imn??t": [5,[0,10,11]],
"hledan??": [6],
"pravopi": [4],
"entitu": [11],
"ochran??": [11],
"rovnaj??c??": [[8,11]],
"doplnit": [[6,11]],
"sentencecasemenuitem": [3],
"strojov??ho": [8,11,9],
"stejn??": [11,[1,5,6,9]],
"neexistuj??": [11],
"uhhhh": [2],
"minimalizuj": [9],
"mo??nost": [11,8,[5,6],9,10],
"nezbytn??": [6],
"mujprojekt": [6],
"stejn??": [11,[5,6],[4,8]],
"substituci": [8],
"u??ivatelsk??m": [5],
"optionssentsegmenuitem": [3],
"nez??le????": [11],
"popisek": [9],
"samohl??sku": [2],
"z??sadn??": [11],
"p??ihla??ovac??ch": [11],
"vystav??n": [11],
"u??ite??n??ch": [2],
"optionsaccessconfigdirmenuitem": [3],
"zah??j??t": [5],
"odstra??uj": [11],
"charact": [6],
"??prav??": [6],
"mezerou": [2,11],
"vlastnost": [[6,11]],
"test.html": [5],
"xxx": [10],
"stejn??": [11,[6,9],[0,5,8,10]],
"hledan??": [[2,11]],
"posledn??m": [8],
"smalltalk": [11],
"opakovan??m": [8],
"budou": [11,8,6,9,5,[1,10],[2,4],3],
"??rovni": [11,8,1,5],
"zp??tn??m": [5],
"z??jmu": [1],
"objem": [5],
"pseudotranslatetmx": [5],
"p??ipojen??": [[4,5,6]],
"neur??it??": [2],
"revizi": [10],
"slov??": [11,8],
"nefunguj": [4],
"parsovat": [6],
"p??esu??t": [10],
"dopad": [11],
"p??ednastaven??ch": [11],
"zm??n??ch": [9],
"v??padek": [8],
"dodate??n??": [5],
"prostor": [11],
"p????stupov??ch": [11],
"vyexportujt": [6],
"targetlanguagecod": [11],
"zm??nami": [5],
"ignorovat": [11,[4,10]],
"naz??v??m": [11],
"stejn??": [[2,6,11]],
"pokra??ovat": [11],
"ko??enov??m": [6],
"p??ekl??dat": [11,[6,10]],
"zabr??nit": [11],
"vytvo??en": [6,[1,5,11]],
"vykazovat": [9],
"dodate??n??": [11,10],
"odpojt": [6],
"spr??vn??ho": [5],
"zadan??m": [5],
"n??zvem": [5,[0,10]],
"sou??asn??ho": [6],
"dodate??n??": [11,[1,2,5]],
"kter??": [11,6,9,5,8,10,1,[2,4],3],
"za??krt??vaj??c??": [5],
"pol??ch": [6],
"v??t??in??": [11,[3,5,6]],
"zv??razn??n??m": [8],
"n??hrada": [11],
"kter??": [11,5,[6,10],[1,4,8,9]],
"aktivov??no": [11],
"m??rou": [9],
"dokonc": [11,[5,9]],
"vlevo": [[6,11],8],
"n??hradu": [11],
"mno??stv??": [11,[2,5,10]],
"doln??m": [9],
"instalov??n": [8],
"n??zev": [11,9,[1,5,6,8],4],
"encyclopedia": [0],
"nem??t": [[4,11]],
"sd??let": [6],
"t????e": [6],
"temn??": [11],
"kter??": [11,[5,8],9,6,4,10,[1,3]],
"prost??edn??k": [6],
"projekti": [8,11,6],
"optionstagvalidationmenuitem": [3],
"projekt??m": [8],
"vypln??n??": [[3,8,11]],
"slovn??k": [4,0,[7,8,9,11]],
"nalezen??mi": [5],
"????slem": [8],
"n??jak??m": [1],
"pt_br": [4,5],
"shodn??ch": [11],
"aplikovat": [11],
"a-z": [2],
"nab??zej??c??": [11],
"zastaveno": [5],
"pom??rn??": [11],
"dostupn??ho": [11],
"zobrazov??n??": [6,[8,11]],
"v??emi": [[5,11]],
"konzoli": [5],
"reviz??": [6],
"vypln??n??": [[8,11]],
"m????ete": [11,5,[4,6,9],8,1,10,[0,2,3]],
"vlo??en??": [1],
"onlin": [4,6],
"sou??asn??": [6],
"sta??en??": [5,1],
"nalezen": [11],
"m??s????n??": [5],
"vlo??en??": [11],
"png": [5],
"plyne": [5],
"vlo??en??": [11,[8,9]],
"konc": [2],
"n??jak??": [[8,11],1],
"vlo??en??": [[1,6,8,11]],
"sou??asn??": [11,1],
"men????": [5],
"??ablona": [11],
"javascript": [11],
"krom??": [11,[0,2,6]],
"mediawiki": [11,[3,8]],
"input": [11],
"sta??en??": [5],
"n??jak??": [[5,6,8]],
"n??vrh??": [[4,10,11]],
"p??id??t": [11,3],
"chv??li": [4,11],
"nep??elo??en??ch": [11],
"n??kolik??t??": [8],
"n??jak??": [11],
"pod": [5,[0,6],1],
"potla??it": [11],
"p??ihla??ovac??": [11],
"dlouh??": [11],
"??lo??i??t??": [6,11],
"p??ekladov??ch": [6,10,11,[7,9],5],
"vol??": [6],
"dvousm??rn??": [6],
"zve??ejn??n??": [0],
"pop": [11],
"metaznak??": [2],
"registrujet": [8],
"sv??ch": [[9,10]],
"found": [5],
"??abloni": [11],
"krok??": [11],
"z??znami": [1,[8,11],[3,5,7]],
"panelu": [5,11],
"zm??n??": [11],
"z??znamu": [1,[8,11]],
"slu??b??m": [11],
"slovn??": [11],
"form??tovac??": [11],
"imunit??": [10],
"aplikov??no": [10],
"form??ch": [11],
"zm??n??": [8,[5,10,11]],
"p??ekladovou": [6,[8,10,11]],
"pot??ebi": [11,6],
"prvn??ch": [11,8],
"kopi": [[4,11]],
"komprimov??ni": [10],
"jazykov??ho": [6],
"rozd??l??": [11],
"googl": [5,11],
"pod??v??t": [11],
"aplikov??na": [11],
"opendocu": [11],
"existuj??c??ch": [11],
"omylem": [11],
"download.html": [5],
"re??imu": [5,11,9],
"vol??n??": [11],
"kl????ov??ch": [11],
"zalo??en??": [[1,11]],
"??lo??i??ti": [11],
"t??m": [11,[3,7]],
"chyb??j??c??ch": [8],
"ovlivnit": [11],
"align": [11],
"b??h": [5],
"b??hem": [11,6,[5,10],[8,9]],
"sourceforg": [3,5],
"zalo??enou": [4,11],
"goodi": [5],
"za????tkem": [2],
"vymezen??": [[2,11]],
"prohledat": [11,8],
"dlouh??": [11],
"editmultipledefault": [3],
"editfindinprojectmenuitem": [3],
"pracuj": [5,11],
"setmentu": [9],
"pro": [11,5,6,8,2,1,3,[4,9],10,7],
"zalo??en??": [11,8],
"vyhledat": [11],
"mus??": [[5,6],1,[3,11],4,10],
"warn": [5],
"technetwork": [5],
"zaji??t??n??": [8],
"exportu": [11],
"synchronizovat": [5],
"m????eme": [6],
"funkc": [11,8,9,[1,4]],
"plural": [11],
"obou": [6],
"jazykov??mu": [4],
"p??eklad": [8,11,9,6,3,[1,7],10,5],
"dokument??": [[6,11],9],
"projektem": [11,6],
"p??eta??en??m": [5],
"zm??nu": [11,10,[5,6,9]],
"otev??r??n??m": [11],
"aplikov??n??": [11],
"u??ivatelsk??m": [[9,11]],
"pozic": [11,4],
"zm??ni": [11,5,[8,10],[2,3,6]],
"chcete": [11,5,[6,9],[3,4,8]],
"colour": [11],
"n.n_windows.ex": [5],
"za??krtnout": [11],
"chang": [5],
"pop-up": [1],
"obsahuj??": [11,[6,10],[1,5,9]],
"projektu": [6,11,[3,8,10],9,[4,5],[1,7]],
"shoduj??": [9],
"hodnoceni": [10],
"projekt??": [11,6],
"program": [5,6,[1,4,11]],
"d??l": [5],
"t??mov??m": [[10,11]],
"v??padkem": [8],
"smaz??n??": [6,11],
"existuj??c??ho": [1],
"form??t": [1,[6,7]],
"tipi": [4,[6,7,11]],
"za??ali": [6],
"nalezli": [5],
"uprav??t": [[3,11]],
"pozor": [6,[4,8],9],
"nab??dkami": [5],
"jednotek": [[10,11]],
"zalo??eni": [0],
"u??in??n??": [5],
"zalo??eno": [11],
"n.n_mac.zip": [5],
"jist??": [1],
"podobnost": [11],
"tabl": [2,3,[7,9],11],
"z??lo??n??": [[6,8]],
"nalezen??ch": [9],
"stahovat": [11],
"pov??imn??t": [5,11],
"aktu??ln??": [8,3,[9,10,11]],
"p??echodu": [11],
"theme": [11],
"z??znam??": [11,[8,9]],
"????dkem": [5],
"nebudem": [6],
"editor": [11,[5,6,8]],
"pseudotranslatetyp": [5],
"p??esunut": [9],
"v??razem": [9],
"dostate??n??": [[6,11]],
"nebudet": [11],
"popisuj": [6],
"za??ed??n": [8],
"t??ma": [6],
"zapisuj": [11],
"skute??nosti": [6],
"syst??mov??": [11],
"smyslupln??j????": [[10,11]],
"tadi": [5],
"projectclosemenuitem": [3],
"project_save.tmx.nahradni": [6],
"viewmarknonuniquesegmentscheckboxmenuitem": [3],
"vyhnuli": [6],
"praxi": [5],
"smaz??no": [11],
"dostate??n??": [10],
"hodnot??m": [5],
"p??ekladech": [[2,7]],
"smaz??ni": [[6,11]],
"vlo??eno": [11],
"zobrazov??ni": [8],
"zobrazovan??": [11],
"bu??k??ch": [11],
"napln??n??": [6],
"extrahovat": [11],
"findinprojectreuselastwindow": [3],
"chce": [[6,9]],
"dostate??n??": [11],
"readme.txt": [6],
"dokumentu": [11,[6,8],[1,3,9]],
"n??co": [6],
"languagetool": [11,8],
"oken": [11,[5,8]],
"??vodn??ho": [5],
"source.txt": [11],
"files.s": [11],
"rovn??": [11],
"zleva": [6],
"spole??n??ch": [9],
"histori": [8],
"exchang": [1],
"request": [5],
"strojov??m": [[3,8]],
"zkop??ruj": [11,[8,10]],
"dokon??it": [11],
"currseg": [11],
"takov??ch": [[6,11]],
"operaci": [5],
"point": [11],
"jmenuj": [5,11],
"zve??ejn??ni": [6],
"p??eps??na": [[5,10]],
"pr??zn??ho": [8],
"z??stupc": [5],
"dokumenti": [6,8,11,[3,5],10],
"licen??n??": [5],
"prvot????dn??": [11],
"proch??zet": [3,[8,11],[5,9]],
"dvojit??ho": [5],
"posl??n??": [11],
"p??ech??zet": [9],
"nezobrazovat": [[3,8]],
"alternativa": [[5,11]],
"nal??zat": [11],
"ikonu": [5,8],
"ikoni": [5],
"alternativu": [[8,11]],
"odporovat": [11],
"procesu": [11],
"account": [[5,11]],
"identifik??toru": [11],
"dhttp.proxyhost": [5],
"pluginu": [2],
"klikn??t": [11,5,8,[4,9]],
"v??choz??m": [11,8,6,[5,10],[1,2,9]],
"t??to": [11,5,[1,4,6,9]],
"opakovan??": [4],
"zorientujet": [11],
"v??skyti": [11,4],
"autorsk??ch": [8],
"na????t??ni": [10,11],
"p????padech": [[6,11]],
"ka??d??": [[8,11],6],
"up??ednostnit": [11],
"z??pat??": [11],
"vyhodnocuj": [11],
"v??skytu": [11],
"nalezen??m": [9],
"prototypech": [11],
"uveden??m": [9,[1,6]],
"you": [9],
"nezobraz??": [[8,11]],
"kanadsk??": [11],
"strukturovan??ch": [1],
"contient": [1],
"krit??ri??m": [11],
"tagu": [11,8],
"p??eloeno": [11],
"plugini": [11],
"t??kaj??": [6],
"configur": [5],
"pod??kov??n??": [8],
"tagi": [11,6,8,3,5],
"obrazovc": [5],
"reprodukovat": [6],
"nepou??iteln??": [11],
"vyhledejt": [0],
"produkt??": [6],
"nejvy??????": [9,10],
"pot??ebn??": [[4,5],0],
"zobrazovac??": [6],
"prost??ed??": [5,9,[6,10,11]],
"nakliknut??m": [11],
"hostovan??": [11],
"optionsworkflowmenuitem": [3],
"pozornost": [5],
"releas": [6],
"jin??m": [[5,6,11]],
"vyber": [8,11],
"sparc": [5],
"ode????t??n??": [2],
"sob??": [2,11],
"hod??": [11],
"hexadecim??ln??": [2],
"m??ri": [10],
"aktualizov??n": [[1,11]],
"t????e": [11],
"zobrazen??m": [11],
"dal????mu": [[8,11]],
"procentn??": [10],
"podadres????i": [[5,10],[0,6,11]],
"segmentac": [11,[2,6,8],3],
"kop??rov??n??": [4],
"shoduj??c??": [11],
"podp??rn??": [6],
"obchodu": [5],
"m??ra": [9],
"opakovan??": [11],
"urychlil": [6],
"signalizac": [2],
"vyd??na": [8],
"zadejt": [5,[1,6,11]],
"odd??li": [6],
"slovinsk??": [9],
"obr??cen??mi": [11],
"v??sledk??": [11],
"prost??": [8],
"zam??????": [11],
"na????t??n??": [[6,11]],
"danou": [[9,11]],
"v??eobecn??": [11],
"jin??ho": [[4,8,9]],
"nesezn??m??t": [6],
"p??ilo??eno": [11],
"dopln??n??": [11,3,8,5],
"otev????t": [5,8,[3,6],11],
"instal??tor": [4],
"rozeznateln??": [1],
"obrac??": [2],
"okno": [11,8,9,5,[1,7],[3,4]],
"p??ekontrolujt": [8],
"nikdi": [11],
"forward-backward": [11],
"p????pustn??": [6],
"definici": [3],
"nehled??": [11],
"zapisovat": [8],
"dvojklikem": [5],
"z??kladn??": [5,11],
"poskytuj": [11,[5,8]],
"p??ep??nac??ch": [11],
"p??ej??t": [9,[3,7,8,11]],
"okna": [11,9,8,5,7,[0,6]],
"taki": [5,11],
"file-source-encod": [11],
"dokumentech": [11],
"ps??t": [11],
"krit??rii": [11],
"session": [5],
"krit??ria": [11],
"uprost??": [2],
"zobrazovalo": [6],
"chod": [5],
"textov??": [8,[6,11]],
"dos??hnet": [[6,11]],
"zobrazovali": [11],
"syst??mov??mi": [3],
"terminologick??ch": [1],
"v??ech": [11,[6,8]],
"pot??ebuj": [6],
"celkov??m": [11],
"za??azeni": [11],
"editexportselectionmenuitem": [3],
"zalomen??": [11],
"speci??ln??ch": [11],
"textov??": [11,6,2],
"home": [5,[0,1,2,3,4,6,8,9,10,11]],
"neplatn??": [[5,6]],
"dvojt??": [8],
"projectaccesstargetmenuitem": [3],
"oprav": [[4,8]],
"vypnuta": [[8,11]],
"zvl??????": [11],
"porozum??n??": [6],
"opakov??n??": [11,8],
"poch??z??": [11,9],
"nejp??ibli??n??j????": [[9,11]],
"varianti": [[2,11]],
"p??vodn??": [11,9],
"prozrad??": [5],
"ponech??": [11],
"vyd??n??": [8],
"uzav??en": [6],
"naskenovan??ch": [6],
"administr??torem": [11],
"v??raz??": [2,11,7,[5,9]],
"v??skyt??": [11,9],
"variantu": [9],
"aligndir": [5],
"zm??na": [11],
"system-host-nam": [11],
"action": [8],
"restartovat": [[3,11]],
"odstavc": [[6,11]],
"p??vodn??m": [[9,11]],
"u??ite??n??": [6],
"uk??zan??ch": [9],
"jmen": [11],
"obecn??": [11,2],
"u??ite??n??": [5,[9,10]],
"creat": [11],
"python": [11],
"tag??": [11,6,5,3,8],
"es_mx.dic": [4],
"odstran??t": [11],
"zpracov??n": [11],
"infix": [6],
"projektov??": [11],
"p??ihl????en??": [11,[3,5]],
"z??lohi": [10],
"operac": [6],
"projektov??": [[6,10,11]],
"tarbal": [0],
"o??ek??v??": [5],
"????astn??ci": [6],
"rozhodnout": [11],
"u??ite??n??": [11,6],
"m??s??c": [6],
"??patn??": [11],
"tak??": [11,5,9,6,1,[8,10],[2,3,4]],
"kapitol": [11,[6,9]],
"??pravou": [[8,11]],
"projektov??": [6,[8,10]],
"v??sledn??": [5],
"pr??zdn??": [11,6,8,10,[1,3]],
"samostatn??ch": [11],
"kroku": [8,[1,6,10,11]],
"pohyb": [11,[8,9]],
"obecn??": [11,[1,7]],
"file": [11,5],
"p??id??": [[6,11]],
"u????v??n??": [6],
"adresa": [5],
"pr??zdn??": [11,[3,5,9]],
"automatick??mu": [11],
"vyskytuj??": [[1,11]],
"kroki": [[4,6,11]],
"norm??ln??m": [11],
"vyhled??van??": [11],
"??k??lu": [[4,11]],
"projektov??": [11],
"pomoci": [5,11],
"nahrazeno": [9],
"menu": [5,[1,11],9,[4,8]],
"vkop??rovat": [4],
"dvojit??m": [5],
"nahrazeni": [6],
"p??esunet": [9],
"vezmet": [3],
"prost??": [[1,6]],
"a-za-z": [2,11],
"nyn??": [6],
"okn??": [11,8,1,4,6,5,[9,10]],
"t??mov??ho": [6,7],
"odpov??daj??c??ho": [9],
"klientem": [5],
"specifikuj": [11],
"chovaj??": [11],
"rozd??len": [[9,11]],
"pracujet": [11,6],
"????d??c??": [2],
"source-pattern": [5],
"cel??ho": [11],
"tak??": [11,6,[1,10],[4,5]],
"barev": [[8,11]],
"nazevprojektu-omegat.tmx": [6],
"zajistit": [11],
"tato": [11,8,5,9,[2,3,6]],
"pr??ce": [6,10,[5,9,11]],
"pr??zdn??": [6],
"jednodu??????": [6,4],
"nikterak": [6],
"nab??zen??ho": [11],
"pr??ci": [6,11,[4,5,9]],
"segment??m": [11],
"vzd??len??ho": [6,[5,8]],
"skriptovac??m": [5],
"pozn??mk??ch": [11],
"v??sledki": [[2,8],[1,11]],
"p??edstavuj??c??": [11],
"vedlej????ch": [10],
"z??klad": [1],
"anebo": [11,[2,5]],
"p??i??li": [6],
"seznamu": [11,8],
"true": [5],
"prioritn??ho": [1],
"startovac??": [5],
"groovi": [11],
"p????stupov??": [11],
"t??mto": [[1,6,11]],
"p??edvolb??ch": [8],
"kte????": [2],
"protiklad": [11],
"kmenueditor": [5],
"v??b??rem": [11,8,3],
"chyb??": [1,[2,9]],
"nep??ekl??dejt": [11],
"nahradit": [11,8,3,7],
"segmentem": [[5,11]],
"st??t": [11,[6,10]],
"pomoc??": [11,6,9,[1,2,5]],
"v??jimki": [11],
"vyhled??v??n??": [11,2,6],
"bert": [5],
"rozbal??t": [5],
"smazat": [11,6,5],
"master": [6],
"kmenuedit": [5],
"v??jimku": [11],
"relevantn??": [[3,8,11]],
"deklinaci": [1],
"nezohled??ovat": [11],
"p????p": [9],
"varianta": [5],
"xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx": [5],
"n??sleduj??c??": [11,2,[3,5,6],[0,8,9]],
"writer": [6],
"automatick??ho": [11],
"ekvivalentn??m": [0],
"skrolovac??": [11],
"dalloway": [11],
"rubi": [11],
"chyb": [8],
"??pan??l??tina": [4],
"objevit": [[3,5]],
"dvoujazy??n??": [11],
"ur??uj": [[5,11]],
"v??razu": [11,5],
"nem??niteln??": [11],
"p??elo??eni": [11,10,[5,9]],
"metoda": [5],
"zobrazen??m": [6],
"p??elo??eno": [11],
"??erven??": [11],
"prioritn??ch": [1],
"v??razi": [2,7,11,1,[3,4]],
"zkop??rujet": [[9,11]],
"metodi": [11,5],
"v??jimka": [11],
"zkop??rov??ni": [9],
"minim??ln??": [6],
"varovat": [5],
"metodu": [11],
"prost??ho": [6,[1,11]],
"takov??to": [11],
"programu": [5,6,[7,8,9],10],
"??e??eno": [11],
"t??m": [11],
"??pan??l??tinu": [4],
"user.languag": [5],
"programi": [[5,6]],
"regex": [2,7],
"meta": [3],
"mujglosar.txt": [1],
"??et??zc": [11,1,6],
"dvoujazy??n??": [6],
"del????m": [9],
"akci": [[0,5,8]],
"??pr??v??m": [1],
"specifick??": [[8,11],10],
"vrstvu": [6],
"zahrno": [11],
"mnoho": [11],
"odpov??daj??c??m": [[6,11]],
"intern??m": [11],
"minim??ln??": [[10,11]],
"mnoha": [6],
"m??t": [11,5,[1,3,4,6,8,10]],
"vytvo??ili": [[4,9]],
"d??d??van??": [11],
"specifick??": [11,6,10],
"p??elo??en": [[5,11]],
"pol????ka": [11,8,4],
"p??elo??ena": [6],
"hled??n??m": [11],
"pol????ku": [11],
"segment??": [11,9,[6,8],10],
"pol????ko": [11,4,[5,8]],
"ibm": [5],
"zda": [[4,5,6],[0,11]],
"pou????vat": [11,5,[1,6],8],
"zde": [11,[5,6],[1,4,7,9]],
"spustiteln??": [5],
"pozn??mkami": [8,[3,9]],
"beze": [11],
"zobrazuj": [9,11,5],
"chov??n??": [5,11],
"n??pisu": [11],
"dobr??m": [11],
"p??elo??en??": [[6,9],[8,11],[3,10]],
"sm??ru": [6],
"upravovat": [11,5,6],
"drobnou": [10],
"p??elo??en??": [8,11,6,3,[9,10]],
"p??elo??en??": [11],
"zalo??it": [11],
"zobrazen??m": [11],
"zelen??": [9],
"v??m": [11,[5,8],[1,6]],
"jak??chkoliv": [[5,6,11]],
"v??s": [[5,11]],
"zm??n??na": [11],
"u??iv": [[5,8,9]],
"v??jimek": [11],
"d??l??te": [11],
"v??ci": [1],
"zm??n??no": [1],
"n??sledov??n": [3],
"zept??": [5],
"tabul??tor": [[1,11]],
"ignoruj": [8],
"idx": [0],
"ru??tini": [5],
"technick??": [11],
"obsahovat": [11,5,[6,10],[3,4,9]],
"pou????v??n??": [6,[1,5,7]],
"qui": [1],
"zm????te": [11,4],
"jazykov??": [4],
"za????naj??": [5],
"kl????": [11,5],
"pot??ebujet": [6,[2,5]],
"projectaccesscurrentsourcedocumentmenuitem": [3],
"v??sledek": [11],
"linux": [5,2],
"roluj": [11],
"synchronizovan??": [[6,11]],
"synchronizov??ni": [6],
"jazykov??": [4,[6,11]],
"hesla": [11],
"p??evod": [6],
"p??elo??it": [11,[5,6]],
"neprioritn??ch": [1],
"heslo": [11,6],
"v??choz??mu": [11],
"ifo": [0],
"podl": [11,8,[3,5,6,10]],
"zav??en": [[6,9]],
"holandsk??m": [6],
"mezi": [11,6,[1,10],9,[2,5,8]],
"zd??": [1],
"identick??m": [10],
"zav??et": [11,6],
"comment": [5],
"takov??mto": [10],
"abecedi": [11],
"m??d": [6],
"segmentov??ni": [11],
"????sti": [11,9,5,[6,8,10]],
"stech": [1],
"posledn??": [8,[3,5,10]],
"xx.docx": [11],
"technicki": [11],
"dokument": [[3,6,8,11],7],
"te??c": [11],
"optionsautocompleteautotextmenuitem": [3],
"segmentovan??": [11],
"bezpe??nostn??ch": [[5,11]],
"p??esn??j????": [10],
"naz??v??": [5],
"jednojazy??n??ch": [11],
"po??adovanou": [0],
"hlavi??c": [11],
"ur??it??": [6],
"vyu????vejt": [6],
"dal????ch": [10,[0,6]],
"libovoln??ho": [11],
"p????slu??n??": [1,3],
"modrozelen??": [8],
"neomezen??": [5],
"p????slu??n??": [11,6],
"nahrejt": [11],
"rozpoznan??": [11,1],
"concis": [0],
"customer-id": [5],
"nach??zej??c??": [11],
"vyd??": [11],
"pomocn??ch": [6],
"p??smenem": [[2,11]],
"term.tilde.com": [11],
"budem": [5],
"otev??en??m": [[9,11]],
"ur??it??": [[8,9]],
"pot??ebuj??": [2],
"segmentech": [[6,11]],
"rozpozn??ni": [8],
"n??lezi": [6],
"nich": [5,[0,11]],
"jasn??": [10],
"viewmarknotedsegmentscheckboxmenuitem": [3],
"stahuj??": [11],
"hierarchi??": [10],
"zastav??": [11],
"p??ihl??????": [11],
"konkr??tn??m": [6],
"konci": [[2,3,10,11]],
"gotomatchsourceseg": [3],
"abstract": [7],
"ob??ma": [1],
"optionssaveoptionsmenuitem": [3],
"excel": [11],
"pohn": [11],
"runn": [11],
"zvan??": [11],
"p??ibli??n??ho": [11,8,[9,10]],
"prohled??vaj??": [11],
"vhodn??ho": [5],
"budet": [11,6,5,4,[8,10]],
"dodate??n??mu": [11],
"stardict": [0],
"jestli??": [[0,5,11]],
"omegat.l4j.ini": [5],
"pam??tem": [11],
"span": [11],
"barvu": [10],
"poli": [5,[1,2]],
"m??nit": [11,[5,9,10]],
"kr??tk??": [11],
"pole": [11,9,[1,2,4,5,8]],
"vyvol??": [6],
"negac": [2],
"nahrazov??n??": [11],
"struktur": [11],
"v??choz??ho": [11,6],
"barvi": [11,[3,8]],
"p??edponu": [11],
"v????": [5,6,11],
"pozvat": [6],
"thunderbird": [[4,11]],
"editselectfuzzy3menuitem": [3],
"term??n??": [9],
"fals": [[5,11]],
"project.projectfil": [11],
"jeho": [11,[0,1,8,9],[5,6,10]],
"sm??rnicemi": [8],
"kroc??ch": [11],
"konec": [[2,3,8,11]],
"spu??t??n??m": [10],
"mno??n??m": [1],
"zahrnuj??": [5],
"dal????ho": [11,8],
"cel??m": [11],
"zna??kou": [[9,11]],
"zeptejt": [6],
"velikost": [[8,11],2],
"kop??rov??n": [11],
"pt_br.aff": [4],
"tmx2sourc": [6],
"otev??en??m": [6],
"milion??": [5],
"spolupracuj": [6],
"p??edpona": [[10,11]],
"ini": [[5,6]],
"t??et??m": [9],
"p??esn??m": [11],
"vykon??": [5],
"maximalizuj": [9],
"????dan??ho": [6],
"zabra??t": [11],
"polo??ek": [9,3],
"ov????ov??n??": [5,11],
"ukon??uj??c??ch": [2],
"dhttp.proxyport": [5],
"ka??d??": [8,[6,11]],
"ov????ujt": [6],
"kanadu": [5],
"kr??tk??": [11],
"ud??lal": [6],
"slovn??c??ch": [8,9],
"mus??t": [5,11,[6,10]],
"funkc??": [8],
"p??ibli??n??m": [11],
"takto": [[5,11],8,[0,10]],
"siln??ch": [11],
"popi": [[3,11],6],
"v??c": [[2,8,9,11]],
"p??vodn??ho": [6],
"znamen??": [2,[5,11],[6,9]],
"jej??": [5],
"score": [11],
"celkov??mu": [9],
"ud??lat": [10],
"v??stupn??ch": [11],
"p??smem": [[9,11]],
"appendix": [[1,2,4],[0,3],6],
"zapisovateln??": [[1,3,8]],
"raw": [6],
"spodn??": [9,11,8],
"fonti": [8],
"p??ekladov??": [9],
"vypn": [8],
"zobrazit": [11,3,8,7,[5,10],1],
"diagrami": [11],
"odpov??daj??c??": [11,6,[2,5,8,9]],
"p??ekladov??": [6,10,11,9,5,8,2],
"aaa": [2],
"instrukc??": [5],
"naprosto": [4],
"indikuj": [6],
"contemporari": [0],
"solari": [5],
"p????ponou": [11],
"zkop??rujt": [6,[5,8]],
"??prav": [6],
"upravt": [[3,4,11]],
"kter??m": [11],
"vyu??it??": [6,[7,11]],
"textov??ho": [11,6,[1,8]],
"nicm??n??": [6,[4,5,11],9],
"evropsk??ho": [6],
"nezam????ovat": [11],
"otev??rat": [6],
"libovoln??m": [8,11],
"deaktivaci": [11],
"p??ednosti": [11],
"algoritmu": [[3,8]],
"kl????-hodnota": [11],
"abc": [2],
"dal????m": [10,6],
"nulov??": [8],
"funk??n??": [11],
"pomal??": [11],
"stejn??m": [11,[0,6]],
"vytvo??en??": [[6,8]],
"abi": [11,[5,6],[3,9],[2,4,8,10]],
"potvr??t": [[5,11]],
"termin??l": [5],
"zad??n": [5],
"pam??tmi": [10],
"postupn??ho": [11],
"zad??t": [[5,11]],
"oknem": [11],
"algoritmi": [11],
"pou????t": [11,6,[3,8],5,1,[4,9],10],
"omegat.ap": [5],
"funkci": [4],
"p??edvolbi": [8,11,[5,6,7]],
"pravid": [[5,6]],
"zdrojov??mi": [11],
"iso": [1],
"uve??m": [6],
"segmentov??n??": [11],
"titulek": [11],
"vstup": [6],
"zv??raznit": [9],
"shodovat": [[1,11]],
"polo??c": [[3,11]],
"pr??zdn??ch": [11],
"zpracov??n??": [11,6,[3,8]],
"n??sleduj??c??ch": [[2,3,5,6,11]],
"????stmi": [9],
"pokou????t": [5],
"glossary.txt": [[1,6]],
"stejn??ho": [6,[2,11]],
"vybran??m": [[6,8,11]],
"extern??ho": [8],
"v??ti": [[2,3,8,11]],
"nimi": [[6,8,9,11]],
"tolik": [10,2],
"ov????ilo": [11],
"asociovat": [8],
"zlom": [11],
"implicitn??": [11],
"v??ta": [6],
"potom": [[9,11]],
"intern??": [[8,9]],
"m????ou": [11,9],
"zobrazen": [11,8,9],
"p??eklad??": [11,9,8,[3,6]],
"optionsautocompleteshowautomaticallyitem": [3],
"??ipkami": [9],
"p??lce": [11],
"zad??v??n??": [6],
"larouss": [9],
"kon????c??": [[5,8]],
"korejsk??": [11],
"instrukci": [11],
"uprav??": [10],
"untar": [0],
"kole??kem": [[1,9]],
"alternativn??m": [6,[9,11]],
"referen??n??": [6],
"n??sledov??no": [11],
"prevenc": [6,7],
"pouz": [11,6,5,1],
"n??sledovan??": [2],
"opravdu": [4],
"jazyku": [4],
"filters.conf": [5],
"n??sledovan??": [2],
"proj??t": [10],
"p??smen": [11,[2,5,8]],
"p??id??v??": [1],
"souborov??ho": [4],
"situaci": [9],
"jazyki": [11,6,[1,4,7]],
"mo??no": [11,9,5,[1,4,6]],
"n??stroj??": [6,[2,8,9]],
"ujedn??n??": [5],
"ne??ek": [1],
"metod??m": [11],
"p??esko??ena": [11],
"jest": [[5,11],6,[8,10]],
"vykon??v??n??": [8],
"kl??ves": [3,11,9],
"p??edvoleb": [8],
"nem??l": [11],
"targetlanguag": [11],
"jazyka": [11,4,5,[1,6]],
"obsa??en??mi": [1],
"zp????stupn??t": [11],
"pou??itelnosti": [11],
"zpracov??ni": [5],
"hladov??": [2,7],
"definov??n": [[4,8,9]],
"filtru": [11,6],
"properti": [[5,11]],
"filtri": [11,8,[3,6,10]],
"znehodnocen??": [6],
"objekt??": [11],
"editselectfuzzyprevmenuitem": [3],
"vytvo??eni": [10],
"podruh??": [11],
"n??sleduj??c??m": [5],
"pot??ebovat": [5,11,4],
"vytvo??eno": [11],
"u??ivatelem": [11],
"vyhnout": [[1,6,10,11]],
"procento": [11,9],
"po????te??n??": [5],
"script": [11],
"nevykon??v??": [11],
"kompatibiln??": [5],
"system": [[6,11]],
"spellcheck": [4],
"rozeznatelnou": [9],
"t??kaj??c??": [11],
"pou????van??": [11,[2,5]],
"po????ta??": [11,5],
"other": [5],
"cokoliv": [3],
"odkazi": [[0,2,11]],
"pou????v??ni": [4],
"obnoveno": [10],
"editaci": [11],
"segmentu": [11,9,8,1,[3,10]],
"local": [6,[5,11]],
"p??ekladatelsk??": [11,9],
"d????v??j????": [11],
"zdrojov??ch": [11,6,[5,8]],
"locat": [5],
"ztr??ti": [6,7],
"zru??en??m": [11],
"k??dovac??": [11],
"zastupuj": [11],
"rozd??l": [11],
"serverech": [[6,11]],
"editorem": [11],
"specifikaci": [11],
"sp??rovat": [[8,11]],
"celkov??": [8],
"negativn??": [10],
"duplic": [11],
"mo??n??": [11,[5,6],2,[1,3,4,9,10]],
"vyu????vat": [5],
"p??id??ni": [[1,5,8]],
"trvat": [4],
"vybr??n": [8,5],
"p??ekladatelsk??": [5],
"celkov??": [9,11],
"p??ijmout": [11],
"nezapisujt": [11],
"zobrazov": [11],
"akc": [8],
"segmenti": [11,8,3,9,10,5,6],
"p??id??na": [[1,10]],
"rlt": [6],
"zobrazuj??": [1,[8,9,11]],
"p??elo??en??ch": [11,[6,9],5],
"nerozhodn": [11],
"p??evezm": [8],
"p??edchoz??m": [8],
"es_mx.aff": [4],
"filtr": [11,6],
"vytvo??en??": [6],
"mode": [5],
"vytvo??en??": [6],
"ozna??en??m": [11],
"vytvo??en??": [6,11,[1,5]],
"obnov??t": [[9,11]],
"ale": [6,11,[5,10],1,4,[2,9],8],
"toolsshowstatisticsstandardmenuitem": [3],
"f??zi": [10],
"ur????t": [5],
"napsan??ch": [11],
"alt": [[3,5,11]],
"p??ekladu": [11,8,9,6,10,4,1],
"p??ekladi": [11,6,8,[9,10],7,1],
"pojmenovan??": [4],
"pojmenov??ni": [4],
"zabr??nili": [6],
"obsa??en??ch": [11],
"seznam": [11,4,[2,5,6,8]],
"nel??b??": [11],
"collect": [1],
"napojen??": [10],
"drobn??": [11],
"extern??ch": [11,6],
"velkou": [4],
"instruovat": [4],
"c??lov??": [11,[6,8],[3,5,9]],
"p??eddefinovan??ch": [5],
"rok": [6],
"podrobnost??": [9],
"modifik??tor": [3],
"jakmil": [[5,8],[6,11],[3,9]],
"and": [5,[4,11]],
"u??ivatel??v": [5],
"pou????vaj??": [11,3],
"c??lov??": [6,11,8,1,4,3],
"n??stroji": [[6,11]],
"ano": [5],
"minuti": [6,[8,11]],
"ulo??en??m": [6],
"dostupn??ch": [11,[2,4,5,9]],
"ant": [[6,11]],
"konfiguracnimu-souboru": [5],
"potvrd??t": [8],
"jazyk??": [11,8],
"p??esn??ji": [11],
"pomalu": [5],
"prove??t": [11],
"p??id??n??": [[5,6],11],
"??ten??": [[1,6]],
"sezen??": [[10,11]],
"helplastchangesmenuitem": [3],
"n??stroje": [11,[3,7],[8,10],2,5],
"omegat.ex": [5],
"ukl??d??ni": [10],
"filtr??": [11],
"rovn??tka": [1],
"jak??mkoliv": [[10,11]],
"sourcetext": [11],
"linuxem": [5],
"n??m": [11],
"vyhled??vac??": [11],
"stejn??m": [11,5],
"stylov??": [11],
"jak": [6,11,[1,5,8,10],[0,7],[2,4]],
"english": [0],
"jar": [5,6],
"api": [5,11],
"najd": [[1,2,11]],
"editselectfuzzy2menuitem": [3],
"p????stroji": [5],
"narozd??l": [5],
"zkratkou": [11],
"zobrazuj??c??ho": [4],
"zkust": [[6,11]],
"vypr??zdn??n": [11],
"navr??en??m": [9],
"spole??enstv??": [6],
"znakov??": [11,8],
"n??kdi": [11,6,10],
"zna??ki": [11,9],
"zcela": [[1,11]],
"pomocn??": [6],
"odd??leno": [11,1],
"zna??ka": [[1,9]],
"odd??leni": [1],
"budouc??": [6],
"oper??tor": [11],
"sam??m": [11],
"st??hli": [5],
"rsc": [6],
"naj??t": [[2,5,8,11],3],
"javou": [5,11],
"editselectfuzzynextmenuitem": [3],
"n??kter??ho": [11],
"hromadn??m": [11],
"postup": [6,8,[3,5,11]],
"vedouc??": [6],
"z??le????": [8],
"zv????it": [11],
"nominativu": [1],
"upravovan??": [8],
"kresbi": [[6,11]],
"zahrnut": [11],
"bl????e": [5],
"vypr??zdn??t": [9],
"podporuj": [[2,6,11]],
"zahrnul": [9],
"jdouc??ch": [11],
"dan??m": [11,9],
"nep??rov??ch": [9],
"zru????t": [11],
"dvouznakov??": [5],
"jistotu": [6],
"jednodu??": [11,[1,4,5,9]],
"vlo??t": [11,8,[5,10],4],
"zahrnuj": [[2,5,11]],
"napi??t": [5],
"zm??nit": [11,3,6,5,8],
"ucelen??": [[6,11]],
"art": [4],
"m??sto": [8,[6,11],[1,3,5]],
"ostatn??": [[5,6],[7,8,9,11]],
"rozd??len??": [9],
"m??sti": [11],
"p??edch??zet": [10],
"vyu????vaj??c??": [7],
"nezobrazuj": [[8,10]],
"jde": [9],
"rtl": [6],
"zahrnout": [[6,9]],
"nab??zet": [1],
"m??sta": [9],
"jdk": [5],
"nejd??le??it??j????": [[5,9]],
"ohledu": [2],
"????seln??": [9],
"asi": [[5,11]],
"??????i": [11],
"po??et": [11,9,8],
"toolsshowstatisticsmatchesperfilemenuitem": [3],
"ukl??d??n??": [[4,6]],
"z??pisu": [6,8],
"bli??????": [[2,6]],
"zdrojov??": [6,[8,11],3,9],
"exportovat": [11,[3,8,10]],
"run": [11,5],
"zatr??ena": [[8,11]],
"jej": [5,11,6,8,9,10,[0,1,3,4]],
"atd": [11,[5,6,9],[0,1,2,10]],
"jen": [11,8,6,[2,5],[1,4],[0,9]],
"nazvan??m": [10],
"titlecasemenuitem": [3],
"atribut??": [11],
"p??esunuli": [11],
"editcreateglossaryentrymenuitem": [3],
"??lo": [5],
"p??ekladatelsk??ch": [6],
"automatick??": [11,3],
"jak??koli": [10],
"mod??": [9],
"zdrojov??": [11,[1,6,9],8,[3,10]],
"kontextu": [11,[3,8,9]],
"ne????douc??": [8],
"statistik": [[6,11]],
"projevili": [11],
"nespecifikuj??": [11],
"tokenizeri": [11],
"ikon": [5],
"znakovou": [1],
"p??ich??z??": [11],
"bod??": [6],
"automatick??": [11,[3,8],6],
"instalov??n??": [5],
"name": [5],
"????ci": [9],
"automatick??": [11],
"instalovanou": [5],
"p????ru??ku": [[7,8]],
"zdrpj??": [6],
"konkr??tn??ho": [11,[4,6]],
"vid??": [6],
"zprost??edkovan??": [9],
"takov??to": [6,10],
"obnoven??": [6],
"jazyk-zem??": [11],
"font??": [8],
"vych??z??": [11,6],
"poml??ki": [5],
"nejpravd??podobn??j????": [[6,9]],
"nejl??p": [[6,11]],
"podokn??": [8,[1,11],9,[6,10]],
"m??st??": [[1,5,8]],
"uka??m": [6],
"nepot??ebuj??": [10],
"kocovku": [1],
"provozovat": [5],
"shod": [6],
"p????padn??": [6],
"kombinovat": [[5,11]],
"p????ru??ka": [7,[3,5,8]],
"target": [11,[8,10],7],
"paramteri": [10],
"config-dir": [5],
"n??stroj??ch": [6],
"jak??hokoliv": [[4,6,9]],
"ignorovan??": [11],
"jim": [8],
"potaz": [11],
"ignorov??no": [3],
"zaps??ni": [[6,11]],
"malou": [8],
"na??ten??m": [11],
"ulo??eni": [11,[5,8]],
"ignorov??ni": [11,5],
"orienta??n??": [11],
"ozna??it": [3,8,11,[5,6]],
"zkontrolovat": [8,11,[6,9,10]],
"z??hlav??": [11],
"ulo??ena": [11,[5,6],10],
"pam????": [6,[10,11],[5,8]],
"glob??ln??": [11],
"zkonvertovan??": [11],
"cesti": [5],
"prob??hat": [11],
"stisknout": [6],
"zam??en": [9],
"trunk": [5],
"targettext": [11],
"v??po??tu": [11],
"instalov??no": [5],
"dopl??ov??n??cki": [[8,11]],
"automaticki": [11,8,5,[1,6],[3,4],9],
"opravit": [[6,11]],
"zat??mco": [9],
"va??e": [5,[3,11],0],
"nebyli": [11],
"plugin??": [11],
"vybert": [11,[5,8],[4,9]],
"instalov??ni": [8],
"skrptovac??": [11],
"zm??nou": [5],
"styli": [11],
"identifika??n??": [[6,11]],
"nejen": [6],
"instalov??na": [5],
"stylu": [6],
"aaabbb": [2],
"p????klad??": [[5,11]],
"??ed??m": [8],
"definujet": [11],
"p????stup": [5,11,[6,8,9]],
"edittagpaintermenuitem": [3],
"optionscolorsselectionmenuitem": [3],
"zaregistrovali": [5],
"startov??n??": [5],
"ukon??uj": [2],
"unicod": [[1,2,7]],
"viewmarknbspcheckboxmenuitem": [3],
"nav??tivt": [2],
"koncovkami": [0],
"u??in??n": [8],
"holand??tin??": [6],
"zprost??edkov??v??": [8],
"lokativu": [1],
"sd??len??": [6],
"vyskytnou": [6],
"minimalizovan??ho": [9],
"situac": [11],
"po??ti": [[8,11]],
"pokud": [11,8,5,6,10,9,4,1,3,2,0],
"podokni": [9],
"ukl??daj??": [[6,10]],
"podokna": [9,11,7,[1,10]],
"z??vislosti": [[5,9,11],8],
"odd??len??": [[3,6,11]],
"po??tu": [[9,11]],
"v??hodn??": [11],
"zpracov??v??": [11],
"vzor": [11],
"valid??toru": [11],
"ulo??en??": [11,[3,6,8]],
"adres????ich": [5],
"atributi": [11],
"samostatn??": [11,[5,9]],
"hledan??mu": [11],
"ulo??en??m": [11],
"msgstr": [11],
"??lut??m": [8],
"samostatn??": [2],
"ignorov??n??": [8],
"za????naj??c??ch": [2],
"????dan??m": [6],
"va????": [5,3],
"ulo??en??": [10],
"alternativn??": [8,11,9,3],
"pou????van??mu": [8],
"odli??n??mi": [10],
"ozna??ni": [11],
"n??kolik": [11,[5,6,8]],
"p??eru??it": [[4,5]],
"hlavn??": [11,9,[3,6],[5,7]],
"rozbalt": [[0,5]],
"omegat.project": [[5,10],[6,7]],
"zapomn??li": [0],
"targetcountrycod": [11],
"na??t??t": [5],
"poslat": [6,11],
"podokno": [9],
"odd??len??": [1],
"grafick??": [5],
"nev??hodn??": [5],
"po??adovan??ho": [5],
"p??ejmenovat": [[4,6],11],
"????inek": [11],
"????sl.a": [11],
"u??it??": [11],
"p??ekladov??": [6,[10,11]],
"webstart": [5],
"prim??rn??": [5],
"um??st??n": [[1,6]],
"um??st??t": [6],
"zdroj-p??eklad": [0],
"za??krtnut??": [11],
"toti??": [11,5],
"po??tem": [11,9],
"syst??mu": [5,11,4,[6,8]],
"vlo????": [8,11,10],
"osi??el??": [9],
"nahraj": [8],
"cesta": [5],
"instaluj??": [11],
"uk??????": [6],
"m??l": [6],
"amount": [5],
"v??jimkou": [2],
"p??esunut??": [9],
"kter??ho": [[6,11]],
"hlavn??ho": [9,11],
"syst??mi": [5,[7,11]],
"syst??mech": [[6,10]],
"differ": [9],
"nap??": [[6,11],5,[1,9,10],[2,4],[0,3,8]],
"rozd??leno": [11],
"odstra??ovat": [[4,11]],
"softwarov??": [5],
"yandex": [5],
"rozd??leni": [11],
"nem??li": [11],
"p????stupni": [8],
"a123456789b123456789c123456789d12345678": [5],
"viewmarkwhitespacecheckboxmenuitem": [3],
"prost??ed??m": [5],
"z??vork??ch": [11],
"souhl??ski": [2],
"p??i??ad??": [5],
"kapitola": [2],
"vp??ed": [8,3],
"zobrazen??": [[9,11]],
"bak": [10],
"n??stroj": [[2,7,11],5],
"reakc": [3],
"bat": [5],
"slo??ku": [5],
"poskytovatelem": [11],
"jazykem": [6,11],
"personalizovat": [11],
"zobrazen??": [11,1],
"jre": [5],
"zobrazen??": [11,6,[5,8,9]],
"pracuj??": [11],
"ji??": [11,6,5,9,8,[1,3,4,10]],
"rozezn??n??": [6],
"vzor??": [11],
"optionsfontselectionmenuitem": [3],
"zobrazen??": [[9,11]],
"tabulku": [11],
"povinn??": [11],
"kopi??": [10],
"??t??st??": [11],
"polovi??n??": [11],
"podob??": [[5,11]],
"jazykov??m": [[4,6]],
"tabulka": [[3,11]],
"prov??d??": [8],
"dvojklik": [11],
"zlom??": [11],
"verz??": [6,5],
"zjevn??": [9],
"z??vis??": [[6,8]],
"tabulki": [11,[6,8]],
"deaktivovat": [8],
"p??ekladov??ho": [[5,10,11]],
"p????kladu": [2],
"validaci": [11],
"jednoduch??": [[1,6,11]],
"vy??aduj??": [11],
"freebsd": [2],
"jedn??m": [[6,11]],
"pou??ij??": [11],
"icon": [5],
"delet": [11],
"ni??????": [1,[6,11]],
"jednoduch??": [2,[1,11]],
"p????kladi": [2,11,7,[5,6]],
"p????stupn??": [[1,6,11]],
"jednotliv??": [[1,5]],
"projectaccessglossarymenuitem": [3],
"proved": [[5,11]],
"zp??t": [8,3,[6,9,11]],
"nahr??vaj??": [8],
"postupovat": [[4,9]],
"neshoduj??": [11],
"sem": [9,11,[5,10]],
"protokolem": [8],
"samostatn??": [11],
"????rku": [1],
"developerwork": [5],
"uv??st": [6],
"obecn??m": [11],
"????rka": [2],
"????dc??ch": [[10,11]],
"nejedine??n??ch": [11,9],
"z??lo??ki": [11,9],
"akceptovat": [10],
"spr??vnou": [4,1],
"z??lo??ku": [8],
"programem": [11,[5,6]],
"optionsrestoreguimenuitem": [3],
"op??t": [[5,9,11]],
"proceduri": [6],
"ur??it??ch": [6,11],
"spr??vn??ch": [[6,10]],
"generov??n": [10],
"rovnat": [5],
"obsa??ena": [11],
"shodou": [[3,8]],
"p????stupn??": [11],
"rovnal": [9],
"z??pisem": [6,7],
"samostatn??": [2],
"nazvan??": [5],
"obsa??eno": [11],
"terminolog": [1],
"offic": [11],
"um??st??n??": [8,11],
"za????t": [11],
"obsa??eni": [6,[5,7]],
"um??st??n??": [5,11,1,6,8],
"po??adovan??": [[5,8]],
"podoken": [9,7],
"shodn??": [9],
"skriptovac??": [11],
"kdybi": [11],
"aktivujt": [11],
"bez": [11,5,6,[0,1,2,8,10]],
"prov??st": [[6,11],4],
"projectsavemenuitem": [3],
"hl????en??": [5,11],
"xmx6g": [5],
"pozd??ji": [[5,11],[9,10]],
"podobn??": [11,[5,6,9]],
"um??st??n??": [5,11],
"microsoftu": [5],
"se??adit": [11],
"tisknut??m": [8],
"po??adovan??": [8],
"takov??chto": [[6,11]],
"zapsat": [8,6,3],
"hran??": [9],
"standardn??m": [8],
"extistuj": [10],
"slou??eni": [11],
"internetu": [4],
"uk??zat": [3,[5,8]],
"klonovat": [6],
"naz??van??mi": [11],
"um??st??n??": [5],
"vlastn??": [11,9,[2,6]],
"verzi": [5,6,4],
"vybran??ho": [[6,8]],
"cursor": [9],
"nev??m": [5],
"odd??l": [5],
"p????klad": [[6,11],5,[0,1,2,4,7,8,9]],
"slovem": [[1,2]],
"podobn??": [11,9],
"terminologick??": [9],
"aktivov??n??m": [11],
"interaktivn??ch": [2],
"po??itadla": [9,7],
"podobn??": [9],
"shoduj": [11,1],
"lom??tkem": [5],
"jmenovan??ch": [[6,10]],
"n??zv??": [11,10],
"syst??m??": [5],
"historii": [8,3],
"p??id??vaj??": [5],
"mezin??rodn??": [[1,6]],
"zad??v??t": [6],
"omez??t": [11],
"ostatn??ch": [11],
"osv??d??il": [1],
"ponech??na": [11],
"pokro??il??": [5],
"p????stroj": [8],
"d??raz": [10],
"vyjmout": [9],
"ur????": [[5,11]],
"pokro??il??": [[2,11]],
"pou??ita": [6,[5,11]],
"v??st": [11],
"kapitoli": [1],
"????slice": [2],
"pou??iti": [11],
"????slici": [6],
"vy??adovala": [11],
"snaz????": [11],
"nevy??aduj??": [9],
"m????e": [11,5,6,9,[1,3,10],8,4],
"p????klad??": [9,[1,4,6,11]],
"podobn??": [[2,6,10,11]],
"pou??ito": [5],
"d??vod??": [11],
"select": [9],
"uchov??ni": [10],
"bodem": [11],
"vzd??len??": [[6,10]],
"dostupn??m": [5],
"nezm??n??t": [11],
"sice": [1],
"zapo??at??": [2],
"bis": [2],
"hodnota": [11],
"platform??ch": [5],
"projectopenmenuitem": [3],
"autom": [5],
"hodnoti": [11,8],
"vylou??en??": [[6,11]],
"informuj": [9],
"anglick??ho": [2],
"zad??vanou": [5],
"hodnotu": [[5,11]],
"vizt": [[2,5,11]],
"porovn??n??": [11],
"po????d??ni": [8],
"kvalita": [6],
"toolsvalidatetagsmenuitem": [3],
"za??n??t": [[1,6]],
"pravd??podobn??": [[1,2,5,11]],
"archivujt": [6],
"kvaliti": [8],
"autor": [[8,9,11]],
"komunikuj": [6],
"vy??adov??no": [2],
"kvalitu": [10],
"varov??n??": [[9,11]],
"nejprv": [11,[4,6,9,10]],
"maskovat": [5],
"potvrzen??": [11],
"spr??vn??mi": [0],
"term??n": [1,8],
"p??ejd??t": [5,[4,11]],
"neozna??eno": [11],
"viewmarktranslatedsegmentscheckboxmenuitem": [3],
"v??hu": [10],
"valu": [11],
"b????n??m": [5,8],
"nazevsouboruprovystup": [5],
"nahr??v??n??": [11],
"dot??k??": [8],
"neznamen??": [2],
"??asov??ch": [6],
"vypnout": [11],
"pojavni": [1],
"optic": [6],
"nakonec": [5,11],
"sekund??ch": [11],
"editselectfuzzy1menuitem": [3],
"pevn??": [[5,8]],
"budouc??ch": [6],
"hide": [11],
"chov??n??m": [8],
"tabul??toru": [[1,2]],
"vzd??len??": [6,10],
"p????kazov??m": [5,6],
"posunout": [11],
"segmenta??n??ch": [[2,11]],
"n??vratu": [2],
"auto": [10,6,8,11],
"souvislej????": [11],
"un-com": [5],
"notepad": [1],
"pr??vodc": [5],
"importujet": [8],
"zobrazeno": [8],
"oracl": [5,3,11],
"zobrazeni": [11,8,[6,10],[1,9]],
"jednoduchou": [6],
"vysv??tlen": [6],
"kvalit??": [6],
"????inn??": [11],
"v??c": [10],
"zobrazena": [[1,5]],
"gradlew": [5],
"nesegmentovan??ch": [11],
"t??i": [6,[0,10],1],
"level": [6],
"v??t": [11],
"upraven??m": [5],
"krok": [6,11],
"odd??lova??": [8,9],
"konfiguraci": [11],
"fialov??m": [8],
"uv??d??": [11],
"kl??vesa": [3],
"plat??": [8,11,5],
"zobrazov??n": [6],
"n??strojem": [0],
"pou??ijt": [6,5,11,4],
"tento": [5,8,11,[6,10],9,[0,1,3,7]],
"zna??ek": [11],
"nakop??rovat": [5],
"switch": [11],
"dopl??ov??n??": [11,[3,8]],
"kam": [[9,11]],
"dvou": [11,6],
"ko??enem": [11],
"zapisovateln??ho": [1],
"bundl": [5],
"cestou": [5],
"interaguj": [11],
"src": [6],
"tabulek": [3],
"p??i??adit": [11],
"my??i": [11,9,[1,5],[4,8]],
"oblast": [[8,11]],
"roz??????en??": [[8,11]],
"control": [[3,6]],
"kdykoliv": [[6,9]],
"znakem": [[1,5]],
"no-team": [[5,6]],
"kl??vesu": [11],
"nimi??": [2],
"zatr??en??": [11],
"kl??vesi": [3,11],
"??as": [[8,11]],
"pou??ili": [6],
"objekti": [6],
"podporuj??c??ch": [6],
"obnov??": [8,9],
"rozd??l??": [11],
"neklad": [10],
"environ": [5],
"informaci": [6],
"p??edchoz??": [8,3,[9,11]],
"optionsautocompleteglossarymenuitem": [3],
"jak??koliv": [1,[2,5,11]],
"vlastnost??": [11],
"spou??t????": [5],
"p????stu": [8],
"d??vodu": [[4,5,8]],
"sklo??ovan??": [1],
"existovat": [1],
"obrazovka": [5],
"p????tomni": [11],
"mana??eru": [4],
"horn??": [[9,11]],
"nesouhlas??": [4],
"t????": [6],
"elektronick??": [9],
"kde": [5,[6,11],8,[3,4,9,10],1],
"perfektn??": [6],
"sto": [6],
"aktivovat": [8],
"nucen??": [[8,10]],
"kdi": [[6,11],[1,5]],
"????dit": [11],
"vytv????et": [11],
"filtrov??n??": [11],
"navigaci": [11],
"zobrazuj??c??": [11],
"specifick??ch": [[9,11]],
"zemi": [5],
"v??mi": [6],
"n??sleduj??c??mi": [11],
"sub": [1],
"languag": [5],
"t??mu": [6],
"portu": [5],
"oran??ov??": [8],
"z??znam": [8,[1,11],3,[2,9]],
"sloupc": [11,[1,8]],
"vyp????": [5],
"sta??en": [5],
"spolupr??c": [6,5],
"souborech": [11,6,[1,5,8,9]],
"pravidlech": [2],
"d??lku": [9],
"key": [5,11],
"skl??d??": [11],
"za????dat": [5],
"p??i??azovat": [8],
"p??ibli??n??m": [11,8],
"svg": [5],
"opust??t": [10],
"op??tovn??m": [11],
"um??st??t": [1],
"znak": [2,11,[3,5,7,8]],
"zach??zet": [[9,11]],
"launch": [5],
"svn": [6,5,10],
"my????": [[8,9]],
"zachov??": [10],
"pojem": [2,1,8],
"tradi??n??": [5],
"koment????": [11,1,9,[7,8]],
"dialogov??ho": [11,8],
"sv??m": [5,11,[4,6,9]],
"parametrech": [5],
"lok??ln??": [6],
"nechejt": [10],
"editreplaceinprojectmenuitem": [3],
"symbol": [2],
"zem??": [11,5],
"ukl??dat": [[4,6]],
"detekovat": [8],
"vytvo??en??ho": [9],
"zdroj??": [11,6],
"express": [2,11],
"uskute????uj": [6],
"str??nce": [[0,5],[8,11]],
"provoz": [[5,7],8],
"n??meck??": [11],
"vlastnosti": [11,6,8,[1,4],[0,3,5,7,10]],
"dostupn??": [[3,5,6,11]],
"v??t????": [10],
"gotoprevioussegmentmenuitem": [3],
"lok??ln??": [6],
"t??k??": [[5,9,11]],
"te??kou": [[2,8,11]],
"regul??rn??": [2,7,11,5,[3,4]],
"gotopreviousnotemenuitem": [3],
"editredomenuitem": [3],
"stole": [9],
"uilayout.xml": [10],
"poskytnut??": [11],
"ekvival": [[8,9]],
"kryje": [11],
"ti??t??n??ch": [9],
"n??zor": [9],
"p????pad??": [11,6,5,9,1,[8,10]],
"p????sn??": [6],
"sp??rovan??ch": [9],
"ozna??en??": [9],
"segmentov??n": [11],
"p????kaz": [5,[8,11]],
"str??nek": [[6,11]],
"zbyte??n??m": [6],
"z??klad??": [11],
"p????pad??": [6,[10,11]],
"chcete-li": [0],
"hostitelsk??ho": [5,11],
"uvnit??": [[1,8]],
"angli??tina": [6],
"projektech": [11],
"zvl????tn??": [6,[9,11]],
"dostupn??": [11,[3,5],[6,10]],
"skriptov??n??": [11,8,7],
"jak??mkoliv": [11,5],
"recognit": [6],
"sv??": [5,11,6],
"odd??len??mi": [1],
"provediteln??": [11],
"omezen??": [11],
"stistku": [11],
"u??i??t": [10],
"omezen??": [11],
"ozna??en??": [11,4,[8,10]],
"byl": [[6,11],[1,5,8,9,10]],
"dostupn??": [[1,9]],
"ozna??en??": [11,[2,7],[5,8]],
"stoj??": [11],
"jakoukoliv": [[1,6]],
"opustili": [8],
"runtim": [5],
"??ili": [10,6],
"rovn??tkem": [1],
"tester": [2,7],
"pou??it??": [11],
"podadres????": [10,11,6,4],
"p????kazov??m": [5],
"obsa??en??": [[5,10]],
"slou????": [[1,11],[6,10]],
"upraveni": [8],
"zeptat": [[6,9]],
"vzori": [11,6],
"probl??m": [1,[8,11]],
"p??elo??iteln??ch": [11],
"filenam": [11],
"vzoru": [11,2],
"technologi": [[5,7]],
"zaji??t??n": [5],
"bu??": [11,[2,4,6]],
"p??elo??t": [6],
"nbsp": [11],
"nepraktick??": [5],
"odstran??na": [10],
"gotosegmentmenuitem": [3],
"kryj??": [1],
"bal??ku": [5],
"ve??ker??": [[6,10,11]],
"odstran??ni": [11,4],
"nevhodn??ch": [11],
"edita??n??ho": [9],
"um??st??na": [[5,10]],
"praktick??ho": [9],
"angli??tinu": [2,5],
"umo??nit": [11],
"ve??ker??": [6],
"xx_yy.tmx": [6],
"k??dov??n??": [11,1],
"key-valu": [11],
"internetov??ch": [11],
"prvn??m": [11,[1,2,5,8]],
"jako??to": [[1,11]],
"helpaboutmenuitem": [3],
"trena??": [2],
"zachovat": [11,5],
"okam??iku": [11],
"v??strah": [5],
"nesegmentovat": [11],
"nezm??n??ni": [11],
"p??ekladatel??": [6],
"regular": [2],
"str??nk??m": [6],
"c\'est": [1],
"sadi": [11,[2,8]],
"sadu": [11,1],
"nainstaluj": [5],
"ozna??ena": [11],
"zkoum??": [2],
"obsah": [11,3,[6,10],[1,5,8],[0,9]],
"elementi": [11],
"pou??it??": [11],
"omezeno": [[1,11]],
"x_linux.tar.bz2": [5],
"str??nki": [8,3],
"zn??zor??uj": [6],
"informac??": [[5,11],6,10,9],
"ozna??eni": [8],
"ozna??eno": [[4,8,11]],
"pou??it??": [11],
"vytvo??t": [6,4],
"form??t??": [11],
"pou??it??": [11,6,5,4,7,[0,2],[1,9]],
"pojmi": [[1,3,11]],
"str??nka": [11,10],
"z??znamem": [[1,11]],
"sada": [11,2],
"slovech": [[1,7]],
"zdroji": [11,9,[5,8]],
"str??nku": [2,[3,8,11]],
"zdroje": [8,11,6,[3,5,9]],
"vlo????t": [[9,11],1],
"vytvo????": [8,[5,11],10],
"p??edch??zej??c??": [6],
"tab": [[1,3],[8,11],9],
"taa": [11,8],
"webu": [6],
"zarovn??n??": [6],
"uk??zka": [11],
"rozezn??ni": [11],
"tag": [11,8,3],
"n??j": [5],
"nalezn": [[1,5,11]],
"tak": [11,[5,6],9,10,8,[1,3],[0,2,4]],
"lokaliza??n??ch": [6],
"tam": [[0,11]],
"vybran??mu": [8],
"tar": [5],
"nainstalov??ni": [5,4],
"kanadskou": [11],
"projectreloadmenuitem": [3],
"p????kazem": [8],
"nainstalov??na": [5],
"odstran??n??": [[6,11]],
"navrhovan??m": [9],
"dostupn??m": [4],
"odstavc??ch": [11],
"safe": [11],
"p??elo????": [5],
"kopii": [6,8],
"v??echni": [11,6,5,8,[2,3,10],[4,9]],
"p??ekladatel??": [6],
"l??n??": [2,7],
"v??echna": [11,9],
"winrar": [0],
"tbx": [1,11,3],
"z??skat": [9,[2,5,11]],
"informov??n??": [11],
"n??zvu": [11,10],
"kter??m": [5,11,[4,8]],
"agenturi": [9],
"cat": [10],
"duser.countri": [5],
"tcl": [11],
"tck": [11],
"readm": [5],
"informac": [6,11,[5,8],3,[1,2]],
"zvolit": [6],
"zarovnat": [8],
"match": [9],
"kliknut??m": [11,5,[1,4,8]],
"makra": [11],
"n??zvi": [11,[4,6,9]],
"lom??tko": [2],
"n??sleduj??c??ho": [5],
"by??": [1],
"jedin??": [11],
"spou??t??t": [5,[8,11]],
"mezeri": [11,8,[2,3]],
"p??ilo??enou": [8],
"align.tmx": [5],
"b??hu": [9],
"lom??tki": [3],
"mezera": [[2,11]],
"??ed??": [8],
"chybn??": [[8,11]],
"poklikem": [5],
"p??ednost": [8],
"v??sledkem": [11],
"lom??tka": [[2,5]]
};
