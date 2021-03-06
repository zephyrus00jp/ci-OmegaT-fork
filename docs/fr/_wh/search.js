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
 "Annexe??A.??Dictionnaires",
 "Annexe??B.??Glossaires",
 "Annexe??D.??Expressions r??guli??res",
 "Annexe??E.??Personnalisation des raccourcis",
 "Annexe??C.??V??rificateur orthographique",
 "Installation et ex??cution d&#39;OmegaT",
 "Guides pratiques",
 "OmegaT 4.2 ??? Guide de l&#39;utilisateur",
 "Menus",
 "Volets",
 "Dossier projet",
 "Fen??tres et dialogues"
];
wh.search_wordMap= {
"altgraph": [3],
"au-dessus": [11],
"r??sultant": [11],
"??crivant": [11],
"souhait??": [8],
"lui-m??m": [2],
"??tre": [11,6,5,1,3,8,[2,4,10],9,0],
"pr??venu": [11],
"r??guli??r": [2,11,[5,6],[3,4]],
"l\'avoir": [8],
"changent": [6],
"xml": [11],
"devrez": [6,[5,11]],
"tel": [8,[4,5,10,11]],
"d\'??viter": [10,[6,11]],
"avant": [11,8,6,10,[1,4,5,9]],
"italiqu": [11],
"logiqu": [[2,11]],
"formulair": [5],
"info.plist": [5],
"rel??ch??": [3],
"sert": [10],
"xmx": [5],
"produit": [6,[5,10],[8,9]],
"cour": [9,8,[10,11],5,1],
"produir": [6],
"nous": [[6,11]],
"fuzzi": [8],
"utiliseront": [11],
"befor": [5],
"r??viseur": [11],
"pouvoir": [5,[3,4,11]],
"sera": [11,[6,8],5,1,9,[3,10]],
"util": [11,5,[2,6],[4,9]],
"l\'applic": [[5,6],8],
"quitter": [[3,8,11]],
"op??rateurs": [7],
"tar.bz": [0],
"avid": [2],
"sp??cialis??": [9],
"quittez": [8,[6,11]],
"lire": [[5,6]],
"installeront": [5],
"remplac??": [6],
"commenc??": [11],
"dgoogle.api.key": [5],
"format??": [[6,11]],
"avait-il": [11],
"ces": [11,6,[4,8],5,10,9],
"edittagnextmissedmenuitem": [3],
"purement": [6],
"r??ticents": [7],
"cet": [11,[6,8]],
"raccourci": [3,5,8,11,[2,6,9]],
"sp??cifi": [[5,11]],
"quiet": [5],
"seul": [11,2,5,[6,8],[0,9]],
"cat??gories": [7],
"recherch": [11,8,2,[3,5],[4,6]],
"tutoriel": [5],
"xlsx": [11],
"d??p??t_de_tous_les_projets_omegat_en_??quip": [6],
"repr??sent??": [11],
"essayez": [11],
"es_es.d": [4],
"heur": [[6,11]],
"d\'??tablir": [11],
"n??cessair": [[5,6,11],4,10,[0,1,2]],
"param??tr": [5,11,6,8,10,4],
"assembledist": [5],
"gnu": [0],
"the": [5,0],
"pr??sentat": [11],
"d\'orthograph": [[4,8,11]],
"trouvaient": [9],
"d\'assur": [8],
"projectimportmenuitem": [3],
"autoris": [11,5,8],
"r??gulier": [6],
"validez": [6],
"veuillez": [[10,11]],
"imag": [5],
"exclusiv": [6],
"monolingu": [11],
"target.txt": [11],
"l\'ann??": [6],
"standard": [[4,11],[1,6,8,9]],
"d\'espac": [11,[2,8],3],
"d??livr??": [5],
"poss??dent": [11],
"pr??-exist": [8],
"correct": [[5,6,11],4,[1,8,10],9],
"traduct": [11,6,[8,9],10,5,3,2],
"v??rifi": [[8,9]],
"analys??": [6],
"viennent": [8],
"m??tacaract??r": [2],
"ajout??": [[6,10],5,8],
"nameon": [11],
"fictif": [11],
"renommez": [6],
"entier": [11],
"moodlephp": [5],
"currsegment.getsrctext": [11],
"optionsglossarytbxdisplaycontextcheckboxmenuitem": [3],
"priorit??": [11,8],
"export": [6,11,8,[3,10]],
"caract??re": [7],
"mieux": [11],
"gotonextnotemenuitem": [3],
"par": [11,6,8,3,5,9,2,10,1,4,0,7],
"tar.gz": [5],
"autour": [11],
"pas": [11,6,5,8,[1,2],9,4,10,3],
"pay": [5,11],
"transtip": [[3,9]],
"d\'option": [11],
"list": [11,[4,8],[2,5,6,10]],
"relatives": [7],
"sp??cial": [[6,11]],
"corrig??": [11],
"dictionnari": [0],
"xxxx9xxxx9xxxxxxxx9xxx99xxxxx9xx9xxxxxxxxxx": [5],
"veiller": [11],
"int??gr??": [11,[4,9,10]],
"??galement": [11,5,6,[4,9],8,[1,3,7]],
"azur": [5],
"fr-fr": [4],
"syst??matiqu": [5],
"synchronis": [[5,6,11]],
"formats": [7],
"incluent": [11],
"retrouv": [9,[8,11]],
"minim": [11],
"s\'assur": [11,[5,6]],
"??ch??ant": [5],
"conna??tr": [11],
"lent": [11],
"pr??d??finies": [7],
"propos??": [9,[5,8]],
"partiell": [11,8,9],
"appara??tra": [10],
"g??n??rer": [6],
"con??u": [11,6],
"webster": [0,[7,9]],
"aussi": [[5,6],[2,9,10,11]],
"combin": [11],
"recharg??": [6,1],
"japonai": [11,5],
"milliard": [5],
"menus": [5,11,8,7],
"indiquera": [6],
"liaison": [10],
"orient??-objet": [11],
"citation": [7],
"cjk": [11],
"impliqu": [5],
"ins??rer": [8,[3,11]],
"sp??cialement": [[4,9]],
"reconnu": [11],
"m??mes": [[1,4,5,9]],
"pdf": [6,[7,8,11]],
"num??ris??": [6],
"chariot": [2],
"syntax": [11,3],
"permis": [11],
"griser": [11],
"personnel": [5],
"passant": [11],
"??taient": [8],
"empti": [5],
"apport??": [5,11],
"blocs": [7],
"neutralis??": [5],
"d\'archiv": [0],
"vieill": [11],
"toolsshowstatisticsmatchesmenuitem": [3],
"focus": [11],
"viewdisplaymodificationinfononeradiobuttonmenuitem": [3],
"appuy": [11,9,6],
"r??pertoir": [10],
"locaux": [11],
"variabl": [11],
"l\'extens": [11,6,[1,10]],
"tmx": [6,10,5,11,8,[3,9]],
"propos": [[5,8,9,11]],
"cr????es": [9],
"d\'inform": [5,[6,11],10],
"peu": [[2,6,11]],
"moteur": [8,11],
"capabl": [[9,11]],
"actuel": [8,11,3,10,6,5],
"traductions": [7],
"contiendra": [10],
"d\'abr??viat": [11],
"v??rific": [[1,2,6,8,11]],
"distant": [6,10,[8,11]],
"nl-en": [6],
"m??canism": [8],
"fen??tr": [11,8,9,5,4,[3,6,10]],
"integ": [11],
"intel": [5,7],
"align??": [[8,11]],
"mainmenushortcuts.properti": [3],
"pr??traduct": [6],
"projectaccesswriteableglossarymenuitem": [3],
"chinois": [5],
"cat??gori": [2],
"pr??parat": [6],
"presser": [11],
"enfonc??": [3],
"c\'est-??-dir": [6,11,5,10],
"surtout": [11],
"glisser-d??plac": [5,9],
"convertir": [[6,11]],
"cmd": [[6,11]],
"savoir": [8],
"assist??e": [7],
"coach": [2],
"pressez": [11],
"unit??": [11,10],
"entrez": [11,5],
"conservez": [10],
"sentencecasemenuitem": [3],
"gotohistorybackmenuitem": [3],
"emplac": [5,6,11,[8,10],[1,9]],
"choisi": [11,8,5,[6,9]],
"entrer": [11,[2,6]],
"restrict": [11],
"premi??r": [11,8,[1,5],[6,9]],
"indiqu??": [11,6],
"project-save.tmx": [6],
"sauvegardez": [5],
"renommez-l": [6],
"n\'execut": [11],
"uhhhh": [2],
"saut": [11,2],
"powerpc": [5],
"optionssentsegmenuitem": [3],
"bascul": [6,3,8],
"product": [11],
"??quival": [2,[0,5,9,11]],
"question": [[6,11]],
"fran??ai": [5],
"premier": [11,8,5,[2,3,6]],
"haut": [11,9,5,2],
"suivant": [11,8,3,5,[2,6,9],0,4,[1,7,10]],
"sauf": [[2,6]],
"reconnaiss": [[6,11]],
"typag": [11],
"optionsaccessconfigdirmenuitem": [3],
"r??solut": [6],
"milieu": [[2,6,11]],
"tandi": [9,0],
"test.html": [5],
"incap": [11],
"regard": [11],
"xxx": [10],
"d??tail": [11,[6,9],[5,8]],
"instanc": [5,9],
"smalltalk": [11],
"r??solus": [1],
"provoquera": [11],
"instal": [5,4,0,[7,8]],
"curseur": [8,[9,11],1],
"fichier2": [6],
"d??sactivez": [1],
"travaill??": [10],
"proch": [9,11,[6,10]],
"l\'environn": [5],
"marqueur": [9,[2,11]],
"voir": [11,6,5,[2,9],10,[4,8]],
"omegat.sourceforge.io": [5],
"pseudotranslatetmx": [5],
"soyez": [6,5],
"pipe": [11],
"motif": [11],
"am??lior": [8],
"cliquer": [8,[5,11],4],
"cl??": [11,5,2],
"targetlanguagecod": [11],
"d??chochez": [11],
"d\'??dition": [9,11,8,[3,10]],
"cliquez": [11,5,[4,8]],
"pr??f??rent": [6],
"d\'int??grer": [6],
"tri": [8],
"s\'affich": [[5,11]],
"objet": [11],
"translat": [11,5,4],
"l\'applicatif": [5],
"uniqu": [11,9,[3,5,8],[2,6]],
"suivi": [11,[2,6]],
"annul": [[3,8]],
"pr??alabl": [[4,6,9]],
"reconverti": [6],
"significatif": [11],
"manuell": [11],
"d??tach": [9],
"roug": [11,10],
"deuxi??m": [[1,11]],
"qu\'omegat": [11,5],
"saisissez": [5,[8,11]],
"lancer": [5,11],
"environn": [5],
"fichiers": [7],
"d??p??t_des_sources_de_tous_les_projets_omegat_en_??quip": [6],
"r??pandus": [6],
"suivr": [6],
"applicabilit??": [11],
"diaposit": [11],
"d\'express": [2,9],
"un_autr": [6],
"coh??rent": [11],
"docs_devel": [5],
"l\'origin": [10],
"devrait": [0],
"d??part": [11,[5,6]],
"d\'??tat": [9,[5,7]],
"tsv": [1],
"distanc": [5],
"l\'activ": [5],
"automatiqu": [11,8,3,5,[6,9],4,1],
"lanc": [[5,8,11]],
"??l??ment": [3,11,5,[2,6],[1,8,9]],
"devant": [[5,11]],
"primair": [5],
"flux": [9],
"point-virgul": [6],
"arborescent": [10],
"gnome": [5],
"conven": [4],
"leur": [11,6,10,[1,2,5,8,9]],
"renommag": [6],
"terminaison": [2],
"masqu": [11,6],
"pr??requi": [5],
"fr.wikipedia.org": [9],
"encyclopedia": [0],
"analys": [[2,11]],
"particuli": [6,[5,11]],
"l\'entr??": [8,[1,2,11]],
"changement": [[6,10],[5,8,11]],
"r??p??t??": [11],
"g??r??e": [6],
"celui": [11,4,9],
"traduir": [11,6,10,[5,9],8],
"recharg": [8,11,3],
"conseils": [7],
"coh??renc": [8],
"quel": [11,[2,8,9],[4,5],1],
"traduit": [11,8,6,9,3,[5,10],4],
"appui": [[8,9]],
"traduis": [11],
"l\'installation": [7],
"optionstagvalidationmenuitem": [3],
"nombreux": [[2,6,10,11]],
"doublon": [11],
"csv": [1,5],
"n.n_linux.tar.bz2": [5],
"vont": [[6,11]],
"nombreus": [[6,11]],
"n\'a": [8,6,1],
"s??par??ment": [11,[3,6]],
"pt_br": [4,5],
"fonctionn": [11,[5,6,8]],
"ing??nieur": [6],
"apparit": [11],
"concern": [[0,4,6,9,11],5],
"a-z": [2],
"n\'i": [5,1,8],
"consitu??": [6],
"affichera": [11,5],
"param??tr??": [6],
"demandez": [6],
"caract??r": [11,2,8,[1,9],[3,5],6],
"meilleur": [[9,11],10],
"les": [11,6,8,5,9,10,3,1,4,2,0,7],
"press": [3],
"dock": [5],
"souviendra": [11],
"lorsqu\'omegat": [11],
"sous-titr": [5],
"endommag??": [11],
"devraient": [[5,11]],
"list??": [[3,8]],
"dmicrosoft.api.client_secret": [5],
"javascript": [11],
"marqu": [11,[5,9]],
"mediawiki": [11,[3,8]],
"mappag": [6,11],
"input": [11],
"non-omegat": [11],
"fonctionnel": [11],
"ctrl": [3,11,9,6,8,1,[0,10]],
"priv??": [[5,11]],
"droite": [7],
"document": [11,6,8,3,9,5,[1,2,7,10]],
"pr??vu": [11],
"rapport": [6,[9,11]],
"mainten": [[3,11]],
"export??": [11,[6,8]],
"limite": [7],
"davantag": [11],
"possibilit??": [[1,6,11]],
"moment": [[1,4,11],9],
"attribu??": [[3,5],11],
"destin??": [6,[2,5,11]],
"construir": [5],
"vivement": [6],
"suppl??mentair": [11,5,[2,6,10]],
"nombr": [11,9,[1,6,8],[2,10]],
"n\'exist": [[4,6,9,11]],
"resourc": [5],
"chaqu": [11,6,8,9],
"team": [6],
"xx_yy": [[6,11]],
"effectueront": [2],
"docx": [[6,11],8],
"txt": [6,1,[9,11]],
"charg": [6,11,5,[2,8]],
"googl": [5,11],
"r??vision": [10],
"opendocu": [11],
"suffisa": [11],
"marchera": [5],
"comment??": [11],
"download.html": [5],
"glossaire": [7],
"disqu": [[5,6,8]],
"??tres": [6],
"remplacera": [8],
"d??tect": [[1,5,8]],
"revient": [[8,10]],
"source": [7],
"fr??quent": [5],
"align": [11,8,5],
"proc??der": [[6,11]],
"totaux": [8],
"malgr??": [11],
"sourceforg": [3,5],
"trnsl": [5],
"guides": [7],
"structur": [[10,11]],
"viewdisplaymodificationinfoselectedradiobuttonmenuitem": [3],
"index.html": [5],
"omegat.tmx": [6],
"pris": [6,[5,11],8],
"ressembl": [[2,6]],
"compliqu??": [6],
"champ": [11,[5,8],4,6],
"marqueurs": [7],
"doubl": [5,[2,11]],
"personnalis": [3,11,2],
"ex??cutez": [5],
"editmultipledefault": [3],
"l\'imag": [[4,9]],
"batch": [5],
"mozilla": [5],
"editfindinprojectmenuitem": [3],
"d??posant": [5],
"marqu??": [[10,11]],
"diffrevers": [11],
"d??but": [11,[2,10],[5,6]],
"warn": [5],
"proc??dez": [0],
"attent": [[5,6,11]],
"technetwork": [5],
"d??pannag": [6],
"pratiqu": [[5,6],[0,9,10,11]],
"appliqu": [11,6],
"page": [11,8,[3,5,6],[2,9]],
"auxiliair": [6],
"votr": [5,6,4,9,11,3,8,1],
"initiaux": [11],
"pert": [6],
"plural": [11],
"plupart": [11,[3,5]],
"commune": [6],
"cherchez": [6],
"ralentir": [6],
"d??verrouill??": [9],
"limit??": [11,6],
"panneau": [11,5],
"retirez": [[5,11]],
"l\'int??rieur-m??m": [3],
"vider": [9],
"traduisez-l": [6],
"??diteur": [[8,9,11],1,[5,6,7]],
"manqu": [2],
"d\'ouvrir": [5,11,[4,8,9]],
"d??crite": [[5,11]],
"project.gettranslationinfo": [11],
"prudent": [6],
"doit": [11,6,[3,5],[1,4]],
"attendu": [[1,7]],
"lesquel": [11,6],
"travaillez": [[3,11]],
"bidirectionnell": [6],
"n.b": [11],
"l\'orthograph": [4],
"sl??lectionn??": [8],
"corrompr": [6],
"personnalis??": [[3,8,11]],
"start": [5,7],
"windows": [7],
"niveau": [11,[5,8],6],
"pair": [11,6,5],
"equal": [5],
"l\'arboresc": [10],
"appara??tront": [11],
"colour": [11],
"n.n_windows.ex": [5],
"poss??der": [11],
"chacun": [[1,6,11]],
"chang": [8,[5,11]],
"impliqu??": [6],
"poss??dez": [[4,6]],
"g??n??rales": [7],
"fournira": [6],
"cl??s": [11,5],
"optionsalwaysconfirmquitcheckboxmenuitem": [3],
"tmxs": [[6,11]],
"pui": [11,5,6,[2,4,8]],
"bouton": [11,5,4],
"java-vers": [5],
"ann??": [6],
"d\'usag": [0],
"r??align": [11],
"mettez": [11],
"program": [5],
"ajout": [11,6,5,10,[1,3],[2,8]],
"cyan": [8],
"li??": [11],
"gardez": [11],
"??ditant": [5],
"l\'utilitair": [0],
"pr??venir": [6,7],
"c??te": [5],
"intraduct": [11],
"??tranger": [11],
"traduisez": [6,[9,11]],
"options": [7],
"enter": [5],
"bien": [11,[5,6,9,10],4],
"vous": [11,5,6,9,8,4,10,3,2,0],
"applic": [5,[4,6],11],
"projectteamnewmenuitem": [3],
"??volut": [6],
"dossier": [5,6,11,10,8,1,[3,4],[0,9],7],
"import??": [6,[1,9]],
"utilisera": [5,[4,6]],
"d??placer": [9,[8,11]],
"pr??existant": [6],
"memori": [5],
"n.n_mac.zip": [5],
"d??ploy??": [5],
"revenir": [9,11],
"??crit": [11,8,3],
"tabl": [11,[3,8]],
"ouvrez": [[5,6],[10,11],8],
"appuyez": [9,11,[1,5,6,8]],
"l\'ouvertur": [[6,11]],
"lor": [11,5,6],
"lot": [5],
"ram??n": [11],
"omegat.jnlp": [5],
"l\'attribut": [11],
"traiter": [11,8],
"interagir": [11],
"rempli": [8],
"theme": [11],
"d??pend": [8,[1,5,6]],
"n.n_windows_without_jre.ex": [5],
"peut": [11,6,5,[3,8,9],10,1,4],
"pseudotranslatetyp": [5],
"aider": [6],
"??prouvent": [2],
"existerait": [11],
"affich??": [11,8,[1,9],5,[6,10]],
"initial": [[5,11]],
"confirmez": [5],
"configur??": [10],
"clic": [[5,11],9],
"prof": [11],
"connu": [9],
"ansi": [11],
"avertiss": [11,[5,6,9]],
"automatiseront": [5],
"pr??sent": [11,5,10,[6,9],[0,1]],
"enti??r": [11,6],
"dmicrosoft.api.client_id": [5],
"pr??domin": [10],
"cepend": [6,[5,11],4],
"cha??n": [11,6,9],
"toutefoi": [5,[4,6]],
"config-fil": [5],
"s??lectionn??": [8,11,5,6,[4,9],3],
"titr": [11,8],
"tell": [6,[0,10,11]],
"d\'ex??cut": [5,8],
"demand??": [5,8],
"fournisseur": [11],
"projectclosemenuitem": [3],
"d??p??t_du_projet_omegat_en_??quipe.git": [6],
"nouveaux": [[1,3],[6,11],8],
"ajoutez": [[3,5,6]],
"v??rifier": [11,6,4,[9,10]],
"viewmarknonuniquesegmentscheckboxmenuitem": [3],
"d??piot": [6],
"dan": [11,6,5,8,9,10,1,[3,4],2,0],
"europ??enn": [[6,8,11]],
"correspondront": [11],
"n\'ex??cut": [11],
"zone": [[2,11]],
"castillan": [4],
"sous-r??pertoir": [10],
"c??t??": [6,11,[3,4]],
"d\'omegat": [5,11,3,6,1,[7,8],[0,4,10]],
"consid??r": [[6,11]],
"t??l??charg??": [5,11],
"interrupt": [11],
"apportez": [6],
"orthographique": [7],
"avantageus": [11],
"d??ployer": [5],
"group": [11,6,[2,9]],
"renomm": [[4,11],6],
"dictionnair": [4,0,11,8,9,10,[1,3,6]],
"appara??t": [[5,11]],
"donn": [11,[8,9]],
"findinprojectreuselastwindow": [3],
"system-user-nam": [11],
"fa??on": [11,5,6,[3,4,8,9]],
"format": [6,11,1,8,0,[5,7,9]],
"d??velopp": [2],
"parvienn": [6],
"nomm??": [5,[1,10,11]],
"d??tach??": [11],
"readme.txt": [6,11],
"d\'ic??n": [5],
"restreint": [11],
"donc": [[5,6,11],[4,10]],
"languagetool": [11,8],
"console.println": [11],
"source.txt": [11],
"v??rifiez": [6,0,4],
"files.s": [11],
"histori": [8],
"nouvell": [11,8,5,[1,2]],
"exchang": [1],
"dont": [11,6,5],
"tr??s": [[5,11],[6,10]],
"traitement": [11,3],
"projet_en-us_fr": [6],
"tent": [11,[5,6]],
"incluant": [11],
"endroit": [4,[6,8,9,11]],
"autonom": [[2,5]],
"part": [9],
"currseg": [11],
"point": [11,2,[5,6,8,9]],
"principal": [9,11,[3,4,6]],
"colonn": [11,1,8,9],
"ensembl": [11],
"parc": [6],
"ouvrir": [8,3,[6,11],5],
"lexiqu": [4],
"l\'interm??diair": [6],
"facil": [6,11],
"temp": [11,[4,9]],
"ligne": [7],
"project_files_show_on_load": [11],
"n\'??taient": [11],
"diff??rent": [5],
"attribut": [11],
"chef": [6],
"l\'exist": [5],
"souhaitez": [11,6,5,[2,4,9,10]],
"ltr": [6],
"d\'utilis": [11,[2,5],[4,6,10]],
"d??s": [8,[1,10,11]],
"optionsexttmxmenuitem": [3],
"downloaded_file.tar.gz": [5],
"processus": [11,6],
"l\'ext??rieur": [9],
"build": [5],
"ma??tr": [11],
"lettr": [8,2,11,[3,6]],
"lue": [[5,6]],
"marketplac": [5],
"account": [11],
"lui": [5,11,9],
"rassembl": [[2,6]],
"op??rat": [[6,9,10,11]],
"d\'en": [[8,11]],
"dhttp.proxyhost": [5],
"rencontr??s": [7],
"entries.s": [11],
"lus": [[1,10]],
"gotonextuntranslatedmenuitem": [3],
"targetlocal": [11],
"path": [5],
"sugg??r": [9],
"des": [11,6,8,5,10,9,[1,4],3,7,2,0],
"bidirectionnel": [6],
"barre": [7],
"fl??che": [11],
"double-cl": [8],
"strict": [6],
"soustray": [11],
"citat": [2],
"contient": [10,[5,6],11,9,[7,8]],
"pass": [[8,11],6,[5,10]],
"allsegments.tmx": [5],
"afin": [11,[5,6,10],[3,9]],
"impact": [11],
"stade": [10],
"court": [11],
"passez": [9,4],
"bascul??": [6],
"configur": [11,5,[4,8],3,1],
"helpcontentsmenuitem": [3],
"trouvant": [8],
"domain": [11],
"t??che": [5],
"omegat-org": [6],
"??quipe": [7],
"unicode": [7],
"comptoir": [0],
"descript": [[3,11],[5,6]],
"imp??ratif": [11],
"contienn": [6,11,9],
"d\'outil": [2],
"projectaccessdictionarymenuitem": [3],
"contr??l??": [11],
"chifffr": [2],
"identifi??": [8],
"hor": [6,5],
"optionsworkflowmenuitem": [3],
"p??nalit??": [10],
"d??sactiv??": [8,11],
"journal": [8,3],
"l\'int??rieur": [10,[0,1,2,4,5,11]],
"releas": [6,3],
"cr??dit": [8],
"??tant": [11,8],
"sentent": [11],
"term": [1,11,9,8,[3,6]],
"volets": [7],
"modifi??": [6,[5,8,11],3,1],
"sparc": [5],
"explic": [5],
"d??pendr": [6],
"caract??res": [7],
"logiques": [7],
"modificateur": [3],
"manquant": [8,3,9],
"project_save.tmx.ann??emmjjhhmn.bak": [6],
"n\'ins??r": [8],
"voulez": [11,[3,5,6,8,9]],
"duden": [9],
"connaiss": [6],
"caract??ristiqu": [11],
"march": [8,4],
"c??t??s": [6],
"gestion": [6,7],
"d\'entrer": [11],
"atteindre": [7],
"maximum": [[3,6]],
"d??limit": [[8,11]],
"n\'ont": [9,11],
"spotlight": [5],
"seriez": [6],
"multiples": [7],
"plusieur": [11,5,1,[4,6,8,9,10]],
"??tape": [[6,11]],
"acc??der": [3,11,[5,8]],
"appel??": [5,[4,11],[3,10]],
"inchang??": [11],
"avides": [7],
"dir": [5],
"d\'ins??rer": [11],
"dit": [5,9],
"div": [11],
"subdir": [6],
"dix": [8],
"vraiment": [11,5],
"mani??r": [6,11,10],
"exemples": [7],
"s??parateur": [9],
"trait": [11],
"viewfilelistmenuitem": [3],
"acc??dez": [5],
"pr??cise": [5],
"signal": [2],
"train": [9],
"favoris??": [11],
"encodag": [11,1],
"test": [5],
"activ??": [11,[8,9]],
"simplement": [11,[1,5]],
"tri??": [[10,11]],
"omegat": [5,6,11,8,10,7,4,3,9,[0,1,2]],
"ietr": [[6,8]],
"imprim": [11],
"repli": [8],
"pr??sent??": [1],
"allemand": [11],
"soit": [11,6,[4,9],[2,5],[1,10]],
"ex??cut": [5,11,[6,8],[3,7]],
"fonction": [11,8,9,4,[5,10],[0,1,6]],
"celles-ci": [11,6],
"file-source-encod": [11],
"montr": [[0,9,10,11]],
"refl??t": [8],
"orthographiques": [7],
"tant": [11,6,8,2],
"session": [11,[5,10]],
"console-align": [5],
"entr": [11,6,[1,2,9,10]],
"somm": [11],
"navigateur": [[5,8]],
"lequel": [11,5,[9,10]],
"ms-dos": [5],
"diminu??": [10],
"projectopenrecentmenuitem": [3],
"sous-menu": [5],
"risquer": [6],
"petit": [8],
"s\'i": [0],
"passer": [11,8,5],
"blanc": [11],
"mise": [6,[5,11],9,8],
"pr??vus": [5],
"quelconqu": [[10,11],9],
"collabor": [6],
"coupl": [[8,9]],
"d\'ignor": [[4,8]],
"requiert": [4],
"editexportselectionmenuitem": [3],
"custom": [11],
"trop": [11],
"und": [4],
"grand": [[2,4,6,11]],
"une": [11,6,8,5,2,3,[9,10],[1,4]],
"troi": [6,10,[0,9],1],
"condit": [[0,6]],
"glyph": [8],
"d\'interfac": [[5,10]],
"projectaccesstargetmenuitem": [3],
"partir": [5,11,[3,6,7,8],10],
"fournit": [5,11,4],
"surlign": [9],
"editoverwritemachinetranslationmenuitem": [3],
"relat": [11],
"ingreek": [2],
"appell": [11],
"bureaux": [5],
"illustrations": [7],
"comportera": [10],
"donnez-lui": [6],
"fusionn": [6],
"ins??r": [[8,11]],
"cocher": [[8,11]],
"dispos??": [8],
"fiabl": [11,10],
"n\'??tant": [2],
"nouveau": [6,11,5,[4,8],3,[1,9]],
"es_es.aff": [4],
"visibl": [[6,9,10,11]],
"convers": [6],
"construct": [2],
"ignor": [11,[8,10]],
"m??lang": [6],
"d??cision": [10],
"linguistiqu": [11],
"influenc": [6],
"familiaris??": [6],
"projectexitmenuitem": [3],
"aligndir": [5],
"contenus": [10,11],
"sont": [11,6,5,8,[1,9],10,3,0,[2,4]],
"system-host-nam": [11],
"action": [8,3,[0,5,9]],
"signet": [11],
"text": [11,6,8,9,10,1,[2,3],5,4],
"red??marr??": [3],
"astuc": [11],
"editregisteruntranslatedmenuitem": [3],
"init": [6],
"creat": [11],
"ferm??": [6],
"python": [11],
"es_mx.dic": [4],
"cr??ez": [6,4],
"pr??cis??": [5],
"infix": [6],
"cr??er": [11,6,[5,8],3,[9,10],1],
"cr????s": [10,8,[1,6]],
"accept??": [[3,5,10]],
"utilisez-la": [5],
"adapt??": [5,11],
"maco": [5,3,[1,6,11]],
"envi": [11],
"??l??ments": [7],
"r??alis??": [11],
"tarbal": [0],
"d\'except": [11],
"invalid": [5,6],
"doc": [6],
"pluriel": [1],
"statut": [11,[9,10]],
"portugai": [[4,5]],
"appliquez": [4],
"gardant": [10],
"paramet": [5],
"adress": [5],
"diver": [11],
"mac": [[3,5]],
"??ventuel": [[5,6,9]],
"file": [11,6,[5,8]],
"mai": [6,11,[1,2],9,[4,5,8,10]],
"discr??t": [5],
"maj": [3,[6,11],8],
"travail": [5,[6,9],11],
"mal": [11,[4,8]],
"gauch": [6,11,[8,9]],
"man": [5],
"libre": [7],
"map": [6],
"combin??": [5],
"may": [11],
"prise": [11,[2,5,8]],
"tard": [[9,11]],
"??dition": [1],
"menu": [3,7,11,[8,9],5,[1,4,6]],
"quantificateur": [2],
"l\'arri??re-plan": [10,8],
"url": [6,[4,11]],
"incompat": [3],
"discret": [5],
"n??gation": [2],
"uppercasemenuitem": [3],
"excluant": [6],
"viewmarkuntranslatedsegmentscheckboxmenuitem": [3],
"ult??rieur": [[5,6,10],11],
"a-za-z": [2,11],
"pourra": [1],
"probabl": [[5,6,9,11]],
"globaux": [11],
"cochez": [11,[4,5,8]],
"individuell": [11],
"bonus": [5],
"use": [[5,8]],
"s\'en": [11],
"main": [[5,11]],
"omegat.jar": [5,[6,11]],
"source-pattern": [5],
"ad??quat": [[1,4]],
"omegat.app": [5],
"usr": [5],
"peut-??tr": [11,6],
"plut??t": [[5,6,9,11]],
"international": [6],
"marquag": [8],
"seulement": [11,6,8,1],
"liste": [7],
"utf": [1],
"cach??": [[10,11]],
"sort": [[6,11],[2,5,9]],
"d\'interrog": [9],
"signif": [11],
"servic": [5,11,8],
"rencontr": [11],
"obtenir": [5,[6,9,11]],
"synchronis??": [6,11],
"prenez": [10],
"d\'identif": [11],
"true": [5],
"orthograph": [4,3],
"l\'espac": [11],
"dsl": [0],
"m??ta": [11,3],
"critiqu": [11],
"d??sir??": [5,[0,6]],
"longueur": [9],
"d??posez": [5],
"l\'auteur": [[8,9]],
"d\'o??": [11],
"groovi": [11],
"troisi??m": [1,9],
"prend": [6,11],
"d??filer": [11,9],
"sommair": [[0,1,2,3,4,5,6,8,9,10,11]],
"multi-paradigm": [11],
"??tait": [8,[6,9]],
"d\'??quival": [8],
"devoir": [[10,11]],
"mineur": [11],
"n.n_windows_without_jre.zip": [5],
"med": [8],
"lectur": [6],
"??lectroniqu": [9],
"sous": [5,6,11,8,[1,3]],
"feront": [2],
"l\'avantag": [5],
"transform": [8],
"l\'altern": [[5,11]],
"gris??": [8,11],
"dtd": [5],
"fl??ch??es": [[9,11]],
"auparav": [8],
"cr????e": [11,9],
"imm??diat": [[1,8]],
"dictionair": [6],
"tentat": [5],
"affichage": [7],
"fichier": [11,6,5,8,10,1,4,9,3,0,7],
"celui-ci": [6,11,[4,9]],
"l\'exempl": [9,11,[0,2,4,5,6]],
"annot??": [8,3],
"exp??riment??": [5],
"projectcompilemenuitem": [3],
"console-transl": [5],
"pr??serv??": [11],
"master": [6],
"kmenuedit": [5],
"coll??gu": [9],
"gotonextuniquemenuitem": [3],
"gratuit": [5,[4,11]],
"conform": [[4,6,11]],
"n\'indiqu": [11],
"num??ro": [8,[5,11],[3,6,9]],
"correcteur": [4],
"xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx": [5],
"fichiez": [6],
"d??poser": [9],
"writer": [6],
"recommand??": [11],
"wordart": [11],
"princip": [11,[3,6,9]],
"dalloway": [11],
"rubi": [11],
"optionsviewoptionsmenuitem": [3],
"dur": [[5,6,8,11]],
"inform": [11,5,[3,8],6,[0,2]],
"s\'il": [8,11,[5,10],9,[0,3,4,6]],
"puiss": [11,10],
"habituel": [8],
"commit": [6],
"targetlocalelcid": [11],
"pourrait": [4],
"danger": [6],
"project_stats_match.txt": [10],
"archivez-l": [6],
"dvd": [6],
"xmx2048m": [5],
"revoir": [10],
"gr??ce": [5],
"m??gaoctet": [5],
"abaiss??": [10],
"pr??c??d??s": [2],
"suscept": [6],
"xxxxxxxxxxxxxxxx.xxxxxxxxxxxxxxxx.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx": [5],
"support??": [11],
"r??p??t??es": [11],
"user.languag": [5],
"regex": [2],
"d\'un": [6,11,10,8,[2,5,9],[3,4,7]],
"qu\'un": [11,[5,6,8],10],
"installer": [7],
"meta": [3],
"keystrok": [3],
"risqu": [6],
"entra??n": [11],
"except": [11],
"krunner": [5],
"libreoffic": [4,[6,11]],
"programm": [5,11,6],
"stock??": [11,[5,8]],
"d??compr??ss??": [5],
"con??us": [9],
"appropri??": [6,5,[8,11]],
"l??matis": [11],
"d\'instruct": [11],
"extr??mit??": [2,8],
"global": [8,11,1],
"pr??cisent": [5],
"r??parat": [6],
"texte": [7],
"racin": [6,11,[3,5,8,10]],
"l\'envoy": [6],
"long": [11],
"l\'argument": [5],
"chiffr": [11,[2,5,6,10]],
"signalera": [6],
"mis": [11,6,1],
"navigu": [11],
"gestionnair": [6,4,11],
"suppr": [11,9],
"pr??fix": [11,10],
"l??g??rement": [9],
"enregistrera": [8],
"commande": [7],
"l\'instal": [5,9],
"puissant": [11,[2,6]],
"viewdisplaysegmentsourcecheckboxmenuitem": [3],
"br??sil": [5],
"d\'am??lior": [[8,11]],
"editregisteremptymenuitem": [3],
"non-uniqu": [11],
"ibm": [5],
"commen??": [[2,11]],
"polic": [[8,11],3],
"progress": [9],
"d??coch??": [11],
"open": [11],
"ratio": [11],
"d??compress??": [5],
"fichiers_exclus": [6],
"www.oracle.com": [5],
"entrant": [[8,11]],
"comprenn": [11],
"rapid": [[5,11]],
"project": [6,3],
"xmx1024m": [5],
"ici": [11,6,[5,8]],
"barr": [9,[5,11]],
"monprojet": [6],
"penalty-xxx": [10],
"quittant": [11],
"outil": [11,[6,8],3,[2,10],[5,9]],
"gotonextsegmentmenuitem": [3],
"invers": [5],
"nnn.nnn.nnn.nnn": [5],
"n\'avez": [6],
"remplir": [6],
"r??seau": [[5,6,11]],
"envoy??": [[8,11]],
"d??p??t_du_projet_omegat_en_??quip": [6],
"agrandit": [9],
"ln-co": [11],
"abort": [5],
"guid": [6,[0,3,5,7,8,10,11]],
"encombr": [11],
"laquell": [[4,6,8]],
"idx": [0],
"retraduit": [6],
"internet": [11,4],
"confondr": [11],
"que": [11,6,5,[8,9,10],4,3,[0,1],2],
"jusqu\'??": [11,[2,5,6]],
"r??parer": [6],
"langue-pay": [11],
"brut": [6,[1,11]],
"arriv": [11,[6,10]],
"qui": [11,6,5,8,9,2,10,4,[1,3]],
"s\'arr??ter": [[4,11]],
"entit??": [11],
"projectaccesscurrentsourcedocumentmenuitem": [3],
"remplit": [6],
"linux": [5,[2,7,9]],
"travaux": [[5,9]],
"abr??g??": [11],
"traduirez": [11],
"g??n??riqu": [11],
"n\'apparaiss": [11],
"checkout": [6],
"affichag": [11,3,8,1],
"appuy??": [11],
"majuscul": [2,[3,8,11],5],
"compt": [11,5,8,3],
"h??ritent": [6],
"fermant": [9],
"saisir": [11,[5,6]],
"vouloir": [11],
"existant": [11,6,5,10],
"commenc": [11,[3,5,6]],
"es-mx": [4],
"pr??server": [11],
"ci-dessus": [6,[9,11],5,[2,4,8,10],[0,1]],
"ifo": [0],
"lemmatis": [[1,9,11],3],
"lorsqu\'ell": [11],
"venant": [6],
"segment??": [11],
"comment": [0,[7,11]],
"comprend": [6,[5,11]],
"base": [[5,6,8,11]],
"s??pare": [11],
"enfin": [[5,11]],
"octal": [2],
"fera": [[4,11]],
"t??l??chargez": [5,[0,6]],
"appel": [11],
"moi": [6,5],
"xx.docx": [11],
"aviez": [8],
"fait": [[6,11],5,[8,9],1],
"d??finissez": [11],
"fair": [11,6,9,[4,5,10]],
"mon": [6],
"consist": [11,6],
"mot": [11,8,2,9,[4,5,10],[1,3,6]],
"repris": [11],
"ferm": [[8,11]],
"optionsautocompleteautotextmenuitem": [3],
"th??me": [11],
"t??l??charger": [[0,3,8],[4,5,6,7,11]],
"l\'inclus": [6],
"cibl": [11,[6,8],4,9,1,[5,10],3],
"apercevez": [4],
"ayant": [10,[2,4,9,11]],
"compress": [11],
"d\'??chappement": [2],
"id??": [11],
"d??cochez": [11],
"concis": [0],
"d??cocher": [11],
"permett": [[2,5,8,9,11]],
"word": [6,11],
"d\'h??te": [11],
"langag": [11],
"term.tilde.com": [11],
"sachant": [3],
"extension": [7],
"autoamtiqu": [[8,11]],
"valeur-cl??": [11],
"r??initialis": [9,[3,11]],
"propag": [11],
"publi??": [6],
"validateur": [[5,11]],
"g??n??ral": [9,11,6],
"viewmarknotedsegmentscheckboxmenuitem": [3],
"installation": [7],
"convient": [[4,6,9]],
"non-vis": [11],
"ignor??": [11,[3,5]],
"converti": [11,6],
"supprimez": [[6,10]],
"fonctionnera": [4],
"d\'api": [5,11],
"g??re": [11,6],
"en-t??t": [[8,11]],
"lingvo": [0],
"d??taill??": [[5,11]],
"gotomatchsourceseg": [3],
"quantificateurs": [7],
"mrs": [11],
"optionssaveoptionsmenuitem": [3],
"excel": [11],
"comma": [1],
"agenc": [9],
"puissent": [6],
"correspondances": [7],
"s\'oppos": [11],
"concern??": [11,[4,5]],
"runn": [11],
"r??gles": [11,2,[5,6,10]],
"trouv??": [11,[2,5],1],
"bas??": [11,[4,5]],
"permet": [11,8,9,5,6,[2,4,10]],
"stardict": [0],
"omegat.l4j.ini": [5],
"span": [11],
"voici": [[5,11]],
"d??sarchiv": [[0,5]],
"obligatoir": [11],
"d\'export": [11],
"aller": [9],
"soulign??": [[1,4,9]],
"l\'espagnol": [4],
"d\'aid": [6],
"space": [11],
"existait": [9],
"rep??r": [11],
"pt_pt.aff": [4],
"quantit??": [5,[4,9]],
"m??thode": [5,11,6,8],
"simpl": [[2,5],[4,6,11],1],
"appar": [11],
"html": [11,5],
"d??rogat": [6],
"allez": [[6,11]],
"thunderbird": [4,11],
"ver": [11,8,[0,6]],
"editselectfuzzy3menuitem": [3],
"l\'id": [5],
"artund": [4],
"remplac": [11,8,3,9,10],
"fals": [[5,11]],
"project.projectfil": [11],
"ni??m": [8],
"identiqu": [11,8,[6,10],[5,9],3],
"finit": [[2,9]],
"avanc??": [11],
"d\'acc??": [11,5],
"qualit??": [6,[8,10]],
"conseil": [6,4,5],
"verrouillag": [5],
"n\'h??sitez": [6],
"configuration": [7],
"www.ibm.com": [5],
"mesfichi": [6],
"manuel": [8,[4,6,11],1],
"contextuell": [11],
"shortcut": [3],
"derni??r": [8,3,[5,10,11],6],
"russ": [5],
"d??signer": [3],
"glisser": [11,9,5],
"deviendront": [11],
"annex": [[1,2,4],[0,3],6],
"pt_br.aff": [4],
"tmx2sourc": [6],
"sauvegard??": [11,[6,10],9],
"r??pandu": [11],
"l\'ordinateur": [5,11],
"ini": [5],
"personnalisation": [7],
"contenir": [[5,9,10,11],[3,4,6]],
"command": [5,11,8,6,[3,9]],
"dessin": [11],
"d??sign": [11],
"n.n_without_jr": [5],
"inspir??": [11],
"d??filement": [11],
"dhttp.proxyport": [5],
"concernant": [7],
"respectif": [6],
"pr??paration": [7],
"dernier": [8,[5,10]],
"retir": [6],
"qu\'en": [[0,11]],
"sorti": [6,11],
"viewmarkbidicheckboxmenuitem": [3],
"subrip": [5],
"test??": [6],
"d\'attribut": [11],
"pr??f??renc": [8,11,5,[1,3,6]],
"via": [11,5],
"traitent": [6],
"editeur": [9],
"score": [11],
"qu\'ell": [6,[3,5,11]],
"compteur": [9],
"tapant": [[5,8,11]],
"absent": [9],
"volum": [11],
"donnent": [5],
"approxim": [11],
"entour": [9],
"savez": [11],
"s??parat": [11],
"instruct": [5,[6,11]],
"l\'aid": [[5,6,11],[9,10]],
"d\'applic": [5],
"d\'appuy": [8],
"d??compress": [5,0],
"courant": [[1,11]],
"supprimm": [11],
"raw": [6],
"version": [5,6,8,[2,4,7,11]],
"conserv": [11,[5,6]],
"r??utilis": [6,11],
"diagramm": [11],
"d\'omegat.project": [6],
"charger": [11,8],
"l\'ais": [[5,6]],
"m??me": [11,6,5,[2,8,9],[0,10]],
"aaa": [2],
"contemporari": [0],
"solari": [5],
"n\'incluant": [6],
"projecteditmenuitem": [3],
"l\'historiqu": [8,3],
"chargez": [[6,11]],
"britannica": [0],
"communiqu": [6],
"n\'aura": [[5,9]],
"ind??fini": [1],
"machin": [11,5,8],
"d\'une": [11,5,[2,8,10],9,[4,6,7]],
"??largir": [11],
"d??cimal": [11],
"p??riod": [6],
"abc": [2],
"rcs": [6],
"conten": [11,[1,4,5,8,9,10]],
"ceci": [2,11,5,6,[4,8,9]],
"l\'on": [[8,11]],
"l\'os": [1],
"iceni": [6],
"annul??": [[6,8]],
"strat??gi": [11],
"signifi": [11,[0,6,9]],
"redonn": [11],
"mexicain": [4],
"notam": [11],
"instructions": [7],
"panneaux": [5],
"noter": [11,[6,10]],
"notes": [7],
"crit??r": [11],
"iso": [1],
"r??p??tition": [11,8,9],
"supprim": [11,[4,5,8],[3,6,9]],
"qu\'il": [11,[6,10],[2,5,8],4],
"notez": [5],
"statistiqu": [8,[3,10],6,11],
"enregistr": [8,11,3,[0,5,6]],
"r??gles": [6],
"traitera": [5],
"post": [6],
"glossary.txt": [6,1],
"dessus": [[5,11]],
"finiss": [5],
"contiendrait": [11],
"utilis??": [11,6,5,4,8,[2,3,9,10]],
"d??marreront": [5],
"r??utiliser": [7],
"dsun.java2d.noddraw": [5],
"ant??rieur": [11],
"rem": [[3,8]],
"wikip??dia": [8],
"coch??": [11,8,4],
"add": [6],
"pass??": [11],
"initi": [6],
"ell": [11,[5,6,8,9]],
"ceux-ci": [[6,11]],
"r??sum??": [7],
"s??parer": [6],
"alt??r??": [6],
"r????crire": [11],
"acc??": [5,[8,11],[0,2,6]],
"s\'??changer": [6],
"inconditionnel": [10],
"x0b": [2],
"l\'option": [8,11,[6,9,10]],
"respect": [2,[6,11]],
"arri??r": [[8,11]],
"fusion": [11],
"r??cup??r??": [[5,11]],
"faux": [11],
"canada": [5],
"port": [5,10],
"faut": [[6,10]],
"altern": [[9,11],6,[3,8]],
"http": [6,5,11],
"optionsautocompleteshowautomaticallyitem": [3],
"pr??f??rabl": [11],
"apparaiss": [11,3,6],
"larouss": [9],
"testeur": [2,7],
"untar": [0],
"d\'encodag": [11],
"interf??r": [8],
"chevauch": [9],
"monsieur": [11],
"retir??": [11],
"filters.conf": [5],
"parfoi": [11,5],
"non-g??n??r??": [11],
"projectsinglecompilemenuitem": [3],
"vos": [5,9,[0,3,6,8,11]],
"lisent": [6],
"chapitr": [11,[2,6,9]],
"utilisateurs": [7],
"modifi": [11,5,[1,6],9,8,10,3],
"espac": [11,2,8,[1,3]],
"pouvez": [11,5,9,6,4,[0,3,8,10]],
"visuel": [8],
"s\'appell": [11],
"pour": [11,5,6,8,9,1,3,10,4,2,0,7],
"erreur": [8,6,11,5],
"particip": [6],
"n\'affect": [11],
"recherch??": [11],
"rechargez": [11],
"textuel": [6],
"exempl": [11,6,2,5,4,[8,9,10],0,[1,3]],
"d\'acc??der": [9],
"clone": [6],
"remplacez": [9],
"joker": [[6,11]],
"targetlanguag": [11],
"taper": [11],
"trier": [11],
"copyright": [8],
"officiel": [7],
"pertes": [7],
"tapez": [[5,9]],
"pr??f??r??e": [[9,11]],
"post-trait": [11],
"durant": [11,5],
"system-os-nam": [11],
"occurr": [11,[4,9]],
"combinaison": [[0,3,5,8]],
"syst??m": [5,11,6,[4,8],[3,10]],
"editselectfuzzyprevmenuitem": [3],
"optionstabadvancecheckboxmenuitem": [3],
"trouver": [11,[1,3,5,6],0],
"d\'enregistr": [9],
"identifi": [11,6],
"rien": [2,8,3],
"sp??cifiant": [5],
"simpledateformat": [11],
"optionsviewoptionsmenuloginitem": [3],
"onglet": [9],
"n??erlandais": [6],
"algorithm": [11],
"d??cidez": [11],
"re-cochez": [11],
"tar.bz2": [0],
"effac??": [6],
"l\'un": [8,[0,5]],
"comport": [11,5,[0,8,9,10]],
"d??p??ts": [[6,11]],
"invit": [6],
"d??cider": [11],
"typiqu": [5],
"bundle.properti": [6],
"script": [11,8,5],
"sp??cific": [11],
"versionn??": [10],
"system": [11],
"pertinent": [11,[3,8,10]],
"spellcheck": [4],
"x64": [5],
"poursuivr": [11],
"l\'??diteur": [11,[5,8,9,10]],
"n\'appara??t": [11],
"aid": [3,8],
"issu": [[8,11]],
"partiel": [[9,11]],
"cadr": [5],
"keyev": [3],
"d\'antislash": [2],
"gigaoctet": [5],
"ajust": [11],
"lancement": [5],
"ruptur": [11],
"cell": [11,[6,10],9,2],
"isn\'t": [2],
"ait": [11],
"local": [6,8,5,11],
"valid": [11,3,[5,8],6],
"assur": [[8,11]],
"interfac": [5,11],
"fermera": [8],
"projet": [6,11,8,10,5,3,[1,9],7,4,0],
"traductric": [6],
"locat": [5],
"plusier": [8],
"ordinateur": [[4,5,7,11]],
"commencez": [6],
"indiqu": [11,6],
"s\'appui": [11],
"optionsteammenuitem": [3],
"cr??e": [8,5,11],
"g??n??rale": [11,[6,8]],
"trouvez": [4],
"appliqu??": [11,6],
"gzip": [10],
"enregistr??": [1,11,[6,8,9]],
"n\'import": [[2,11],[8,9],[5,10],[3,4]],
"g??n??ralement": [[2,5,6,11],10],
"parenth??s": [11],
"notif": [11],
"donnez": [5],
"ci-dess": [5,[2,9],[3,4,6,11]],
"x86": [5],
"cr??atif": [11],
"cela": [11,5,9,[6,10],[0,2,4]],
"cite": [2],
"??videm": [4],
"s??par??": [11,1,[6,9],8],
"papier": [9],
"s\'arr??tera": [5],
"chinoi": [6,11],
"nostemscor": [11],
"demi-largeur": [11],
"ignorera": [11],
"d??connectez-v": [6],
"est": [11,6,5,[8,9],10,4,1,3,2,0],
"es_mx.aff": [4],
"l\'??tape": [10,[6,9,11]],
"vue": [11,9],
"filtr": [11,6,8,5,[3,10]],
"donner": [8],
"correspond": [11,6,9,8,2,[3,10],1,4,5],
"modifiez": [[4,5,9],[1,3,11]],
"facultativ": [5],
"console-createpseudotranslatetmx": [5],
"mode": [5,6,[9,11]],
"copier": [[4,6],8,[3,5,9,10]],
"puisqu": [11,9],
"basant": [11,4],
"etc": [11,[5,6,9],[0,2,10]],
"l\'ex??cut": [5,11],
"longman": [0],
"fuzzyflag": [11],
"copiez": [6,5],
"pr??f??rences": [7],
"toolsshowstatisticsstandardmenuitem": [3],
"bureau": [5,[9,11]],
"??t??": [8,11,6,[1,5],9,10],
"oblig": [5],
"merriam": [0,[7,9]],
"s\'ouvr": [[8,11],9],
"l\'esprit": [11],
"read": [11],
"fichier.txt": [6],
"traduire": [7],
"laiss??": [11,[5,6]],
"alt": [[3,5,11]],
"touch": [3,11,8,9,1],
"r??el": [[9,11]],
"sp??cifi??": [11,5,[3,6,8]],
"ensuit": [11,[3,5,6,8,10]],
"projectname-omegat.tmx": [6],
"supprim??": [11,10],
"lancez-l": [5],
"glossair": [1,11,9,3,8,[6,10],[0,4]],
"tool": [11],
"outils": [7],
"illimit??": [[5,10]],
"invari": [11],
"couper": [9],
"intervall": [[6,11]],
"collect": [11,9],
"unix": [5],
"n\'apparait": [11],
"??crite": [11],
"roc": [6],
"cellul": [11],
"eux": [[6,8]],
"qu\'on": [10],
"autres": [7],
"n.n_without_jre.zip": [5],
"re??u": [[5,9,11]],
"bogu": [8],
"calcul": [11],
"and": [5],
"chose": [10,[9,11]],
"predict": [8],
"magento": [5],
"cr????": [6,1,[4,5,11]],
"n\'affich": [[8,11]],
"ant": [[6,11]],
"d??sarchivag": [0],
"l\'utilis": [[5,11],6],
"m??moires": [7],
"supprimez-l": [9],
"n\'activez": [11],
"traducteur": [6,9,11,10],
"bidirectionnalit??": [8,3],
"d\'utilisation": [7],
"saisi": [11,[3,8],6,[1,9]],
"cit??": [10],
"simultan??": [8],
"u00a": [11],
"helplastchangesmenuitem": [3],
"n??anmoin": [11],
"localis": [[5,6]],
"surlign??": [8],
"omegat.ex": [5],
"fen??tre": [7],
"largeur": [11],
"shift": [3,[1,8,11]],
"n\'interf??rera": [5,11],
"sourcetext": [11],
"ouvertur": [5],
"couch": [6],
"compos": [11,[5,6,9]],
"totalit??": [6],
"utiliserez": [10],
"java": [5,11,3,2,[6,7]],
"exe": [5],
"l\'onglet": [8],
"stockag": [11,4],
"boit": [11,[4,8]],
"english": [0],
"jar": [5,6],
"l\'h??te": [5],
"api": [5],
"lang2": [6],
"lang1": [6],
"ambival": [11],
"editselectfuzzy2menuitem": [3],
"project_save.tmx": [6,10,11],
"textuelle": [7],
"subi": [8],
"lanc??": [5],
"multiplateform": [5],
"jaun": [[8,9]],
"dictionari": [[0,10],8],
"progressif": [11],
"marquer": [8,3,[1,11]],
"demand": [6,[5,11],[4,8]],
"d??marrag": [5],
"dictionary": [7],
"avant-arri??r": [11],
"progressiv": [[10,11]],
"codag": [1],
"devez": [11,5],
"logiciel": [11,6],
"obtenez": [5],
"graphiqu": [5,[6,9,11]],
"vide": [11,6,[8,10],3,[1,5,9]],
"d??plac??": [[9,11]],
"besoin": [6,[5,11],[2,9]],
"envoi": [8,11],
"diff??renc": [11,[1,6,9]],
"r??alis": [4],
"pratiques": [7],
"editselectfuzzynextmenuitem": [3],
"presse-papi": [8],
"d\'affich": [8,11],
"surbril": [11],
"cett": [11,8,5,[6,9],10,3],
"recommenc": [11],
"devis": [2],
"read.m": [11],
"traduction": [7],
"diff??rent": [11,[6,8],9,[4,10]],
"envoy": [6,[8,11]],
"visionn": [10],
"readme.bak": [6],
"langu": [11,[5,6],4,9,[0,8,10]],
"g??n??r??": [8],
"s??curis??": [11],
"raccourcis": [7],
"similair": [11],
"timestamp": [11],
"pr??c??dent": [8,3,6,9,11,[0,1,2,4,5,10]],
"art": [4],
"projectaccessrootmenuitem": [3],
"dyandex.api.key": [5],
"rtl": [6],
"suppress": [[10,11]],
"tout": [11,6,5,9,[2,8,10],[1,3,4]],
"gras": [11,9,1],
"prendr": [[3,4,8,10]],
"peuvent": [11,6,10,[5,8],1,9,2],
"d??roulant": [11,[4,8]],
"tous": [11,5,6,8,9,3,2],
"volet": [9,11,8,[1,6],[7,10]],
"jdk": [5],
"mentionn??": [5],
"facilit": [6],
"n\'arriv": [5],
"moin": [[5,6],[10,11]],
"plugin": [11],
"??tat": [6],
"tabul": [[1,2,11]],
"s??curit??": [11,5],
"bo??t": [11,6],
"aurez": [5,10],
"pourrez": [[3,4,8,11]],
"textuell": [11,[6,8]],
"rigoureus": [11],
"chargement": [11],
"glossar": [1],
"toolsshowstatisticsmatchesperfilemenuitem": [3],
"editinsertsourcemenuitem": [3],
"verrouill??": [[5,9]],
"qu\'??": [11,[2,4]],
"r??f??renc": [6,1,[2,9,11]],
"run": [11,5],
"viterbi": [11],
"microsoft": [11,[5,6],9],
"d\'instal": [5,[4,11]],
"projectnewmenuitem": [3],
"hexad??cimal": [2],
"racinis": [9],
"efficac": [11],
"optionstranstipsenablemenuitem": [3],
"utilis": [11,5,6,4,[3,8],1,0,9],
"segment": [11,8,9,3,10,6,[1,5],2],
"publiez": [6],
"l\'outil": [[7,11]],
"d??sarchivez": [5],
"jet": [11],
"titlecasemenuitem": [3],
"d\'instanc": [8],
"jeu": [[1,11]],
"inf??rieur": [[9,11]],
"d\'appliqu": [11],
"publier": [6],
"glossari": [1,[6,10,11],9],
"editcreateglossaryentrymenuitem": [3],
"ignored_words.txt": [10],
"puisqu\'il": [11],
"suivit": [[2,3],11],
"configuration.properti": [5],
"github.com": [6],
"examin": [11],
"lesquell": [5],
"essayera": [11],
"prototyp": [11],
"param??tres": [7],
"ceux": [[2,5,8,11]],
"conservera": [10],
"expressions": [7],
"glossary": [7],
"lorsqu": [11,6,9,5,8,[4,10]],
"gauche": [7],
"compri": [11,9,8],
"??chap": [[1,11]],
"d\'abord": [[4,6,11]],
"anglai": [6,2,[5,11]],
"pertin": [11],
"d??marrez": [[5,6]],
"ayez": [11,6],
"datant": [6],
"string": [5],
"import": [[5,6],11,10,9],
"aux": [11,5,6,8,[1,2,4,10]],
"classes": [7],
"d??place": [8,11],
"d??marrer": [5,11],
"edition": [7],
"non": [11,8,[3,5,6,9],10,2],
"nom": [11,[5,9],6,[4,10],[0,1,8]],
"vid??": [[8,11]],
"outr": [11],
"lorsqu\'il": [11,[6,9]],
"s\'arr??t": [11],
"prot??g??": [10],
"not": [11],
"avi": [9],
"terminologiqu": [11],
"parcourir": [[3,4,5,11]],
"coll??": [8],
"suivez": [6,5,11],
"l\'acc??": [11],
"double-cliqu": [[5,9,11]],
"bonn": [[1,10,11]],
"associ": [8],
"l\'ouvrir": [11,9],
"l\'op??rat": [11],
"particuli??r": [11,[5,6]],
"physiqu": [4],
"mond": [6],
"effet": [11,[8,9]],
"serait": [5,[6,11]],
"selection.txt": [11,8],
"target": [10,[8,11],7],
"xhtml": [11],
"cliquant": [11,[5,9],6],
"empaquet??": [8],
"situ??": [[5,11],1,[8,9]],
"soustract": [2],
"finder.xml": [11],
"effa??": [11],
"sp??cifier": [11,5,[3,10]],
"orthographiqu": [4,11,10,[1,2,8]],
"acc??l??rer": [6],
"grec": [2],
"window": [5,[0,2,8]],
"config-dir": [5],
"ins??rant": [3],
"mati??res": [7],
"copiera": [11],
"contrat": [5],
"l\'utilisateur": [5,11,7,[3,8,9],10],
"l\'??tat": [[8,9,10,11]],
"plateform": [5,[1,11]],
"apr??": [11,[1,5],6,[2,3,4,8,9]],
"disable-project-lock": [5],
"autant": [6],
"donn??": [[6,11],5,[0,1,10]],
"omegat.pref": [11],
"allant": [11],
"termbas": [1],
"logiciell": [5],
"souvient": [8],
"fai": [11],
"cass": [3,11,[2,8]],
"n\'ait": [8],
"poss??dant": [[8,11]],
"genr": [11,10],
"personalis": [11],
"non-avides": [7],
"l\'appel": [11],
"ouvr": [8,[4,11]],
"cons??quenc": [11,9],
"d\'affichag": [6,11],
"singuli": [1],
"r??gle": [11],
"r??tablir": [[3,8]],
"case": [11,4,5],
"d\'extens": [11,9],
"multipl": [9],
"propri??t??": [11,6,[4,5,8],[0,1,3,10]],
"cons??quent": [5],
"source-c": [0],
"dur??": [11],
"violet": [8],
"modul": [11],
"pt_pt.dic": [4],
"auteur": [11],
"explicit": [11],
"re-saisi": [11],
"targettext": [11],
"d\'utilisateur": [6,9],
"glisser-d??placer": [7],
"futur": [10,6],
"r??duit": [9],
"trouvent": [[8,10]],
"signal??": [8],
"droit": [6,[9,11],5,8],
"remi": [6],
"style": [6],
"suit": [5,[0,9,10,11]],
"effectu??": [6,11,[5,8],9],
"level1": [6],
"level2": [6],
"implicit": [11],
"suffisam": [[6,10]],
"consultez": [6,[2,8]],
"orang": [8],
"direct": [5,11,[6,8],10],
"connexion": [6,11,[3,4]],
"aaabbb": [2],
"n\'est": [5,11,8,6,[2,9,10],1,4],
"caus": [5,1],
"d\'entr": [[8,9]],
"r??cent": [8,[3,5,6]],
"web": [5,[6,7,10,11]],
"choisissez": [11,5,8],
"edittagpaintermenuitem": [3],
"enregistrez-l": [6],
"cl??-valeur": [11],
"protect": [11],
"passag": [2],
"optionscolorsselectionmenuitem": [3],
"provoqu": [[6,8]],
"dossier_de_configur": [5],
"hi??rarchi": [10],
"sembl": [[5,11]],
"saisiss": [11],
"alor": [11,6,[4,9,10]],
"editselectfuzzy4menuitem": [3],
"editregisteridenticalmenuitem": [3],
"gris": [8],
"more": [11],
"compteurs": [7],
"display": [11],
"lorsqu\'un": [11,8,[1,6,10]],
"unicod": [2],
"viewmarknbspcheckboxmenuitem": [3],
"recherche": [7],
"optiqu": [[6,11]],
"n??erlandai": [6],
"mettr": [11,4],
"positif": [11],
"effac": [6],
"l\'ins??rer": [9,1],
"pt_br.dic": [4],
"lanceur": [5],
"certain": [11,6,10,9,[0,1,4,8]],
"dirig??": [11],
"l??g??re": [10],
"bout": [11],
"unabridg": [0],
"copi??": [9,11,6,8],
"en-us": [11],
"n\'??crivez": [11],
"section": [[5,6]],
"d\'info": [9],
"encodage": [7],
"refair": [9],
"authentifi??": [11],
"ainsi": [11,5,8,6,[4,9,10]],
"optionsglossaryexactmatchcheckboxmenuitem": [3],
"msgstr": [11],
"orphelin": [11,9],
"qu\'au": [5],
"contextuel": [9,11,1],
"faisant": [[5,6,9,11]],
"dispon": [[5,11],8,[3,6],4,9],
"l\'anglai": [11,6],
"dispos": [11,9],
"s\'appliqu": [8,[5,11],[9,10]],
"important": [6],
"l\'ex??cutez": [5],
"nnnn": [9,5],
"phrase": [11,[2,3,6,8]],
"omegat.project": [6,5,10,[7,9,11]],
"effectu": [11,[5,8]],
"retourn": [[8,11],5],
"targetcountrycod": [11],
"??quip": [6,[8,11],3,[5,10]],
"placez-l": [1],
"option": [11,[5,8],9,3,4,6,[2,10]],
"ins??r??": [11,8,10],
"d\'origin": [9],
"webstart": [5],
"lancera": [5],
"insert": [8],
"continu": [11],
"gamm": [[4,11]],
"rester": [11],
"dictionnaire": [7],
"omegat.projet": [6],
"br.aff": [4],
"project_save.tmx.temporair": [6],
"inutil": [[6,11]],
"zh_cn.tmx": [6],
"d\'exclus": [11],
"comparaison": [11],
"d\'effectu": [[5,8,11]],
"sai": [5],
"messag": [5,6,9],
"scripts": [7],
"l\'erreur": [5],
"san": [[5,11],9,0],
"rest": [11,[5,9]],
"pourront": [[2,4,5,11]],
"d\'exploit": [5,11,8,10],
"paquet": [5,[8,11]],
"glossaires": [7],
"am??ricain": [11],
"consol": [5],
"l\'express": [11,2],
"partag": [6],
"vice-versa": [[6,11]],
"traditionnell": [5],
"yandex": [5],
"archiv": [5],
"d??crit": [[5,6,9,11]],
"user": [5],
"a123456789b123456789c123456789d12345678": [5],
"atteindr": [[3,9,11],8],
"viewmarkwhitespacecheckboxmenuitem": [3],
"proxi": [5,11,3],
"extens": [11,1,0],
"aucun": [11,5,8,1,[6,9],[4,10]],
"ouvert": [11,6,9,8,[1,5]],
"constitue": [7],
"frapp": [11],
"fin": [11,2,10],
"complet": [[8,11],[5,6,9]],
"avoir": [11,6,9,[1,5],[0,2,4,8]],
"bak": [6,10],
"fond": [[8,9]],
"bat": [5],
"bas": [11,9,[3,8]],
"seront": [11,8,6,5,[1,9],10,4],
"complex": [2],
"d\'index": [11],
"jre": [5],
"d\'emp??cher": [11],
"rendr": [11,8,[6,10]],
"optionsfontselectionmenuitem": [3],
"posit": [11,8,6],
"prochain": [8,3],
"pourraient": [5],
"lexicaux": [4],
"r??sultat": [11,8,[2,6]],
"l\'union": [8],
"poss??d": [[1,11],4],
"diff": [11],
"fonctionnalit??": [11,8],
"an": [2],
"editmultiplealtern": [3],
"compl??t": [[3,5]],
"d\'ouvertur": [5],
"famili??r": [11],
"git.code.sf.net": [5],
"au": [11,6,8,5,9,3,10,4,[1,2],0],
"moyen": [11,6],
"structurell": [11],
"d??pos??": [9],
"l\'insert": [11],
"perdu": [6],
"d\'entr??": [11],
"parcourus": [8],
"be": [11],
"productivit??": [11],
"freebsd": [2],
"affect": [[5,8]],
"relativ": [11],
"filters.xml": [6,[10,11]],
"proven": [9,1,[5,6,11]],
"permettr": [[6,8,11]],
"pensez": [6],
"br": [11,5],
"projectaccessglossarymenuitem": [3],
"l\'url": [6,[5,8,11]],
"l\'affichag": [6,11],
"pratiqu??": [11],
"relatif": [[6,9]],
"segmentation.conf": [6,[5,10,11]],
"l\'??cran": [5],
"pr??exist": [11],
"??vit??": [11],
"d\'argument": [5],
"sen": [11],
"l\'emplac": [9,[1,5,6,8,11]],
"ca": [5],
"contigus": [11],
"ses": [[0,5,9,11]],
"minuscul": [[3,8,11]],
"developerwork": [5],
"cd": [5,6],
"ce": [11,5,6,10,8,9,[0,4],[1,2,3,7]],
"??????qw??": [11],
"set": [5],
"balis": [11,6,8,3,5,9],
"d??finiss": [11],
"restera": [11],
"portent": [11],
"cn": [5],
"adjoindr": [9],
"optionsrestoreguimenuitem": [3],
"figur": [4,[0,2]],
"th??mes": [11],
"cx": [2],
"voyell": [2],
"s??lectionn": [11,9,8,5,4,10],
"aller-retour": [6],
"correspondr": [11,4],
"l\'ensembl": [11,[5,8,10]],
"apach": [[4,6,11]],
"adjustedscor": [11],
"font": [[4,10]],
"de": [11,6,5,8,9,10,[2,3],4,1,7,0],
"justif": [6],
"echap": [11],
"terminolog": [9],
"vieux": [11],
"offic": [11],
"ajustez": [11],
"d\'i": [[5,9,11]],
"extern": [11,8,[3,6]],
"f1": [3],
"do": [5],
"f2": [9,[5,11]],
"d\'autr": [6,5,9,[0,1,4,8]],
"f3": [[3,8]],
"parti": [11,9,8,[1,6],[4,10]],
"dr": [11],
"f5": [3],
"du": [11,6,5,8,3,9,10,1,4,7,2,0],
"tenir": [11],
"contr??ler": [[5,11]],
"repositories": [7],
"dz": [0],
"duquel": [5],
"rattach??": [8],
"projectsavemenuitem": [3],
"editundomenuitem": [3],
"tiret": [5],
"enregistrez": [6,3],
"xmx6g": [5],
"proc??dur": [6,[4,11]],
"virtuell": [11],
"u000a": [2],
"remarqu": [[6,11]],
"ic??n": [[5,8]],
"op??rant": [5],
"sp??cificateurs": [7],
"en": [11,6,5,9,8,10,3,4,1,[0,2],7],
"actif": [[8,11]],
"u000d": [2],
"r??ticent": [2],
"et": [11,6,5,8,9,4,10,2,1,3,7,0],
"u000c": [2],
"ex": [5,11,[4,6,9]],
"r??utilis??": [6],
"d??faut": [11,3,8,6,1,[5,9],10,[2,7]],
"activ": [11,8,[3,10]],
"compat": [5],
"isol??": [11],
"u001b": [2],
"foi": [11,6,[2,5],[3,8]],
"stats.txt": [10],
"indic": [6],
"l\'intervall": [11,[6,8]],
"terminologi": [8,[1,6,11]],
"tient": [11],
"origin": [6,11],
"foo": [11],
"s??lectionnez": [11,8,[4,5],6,[1,9,10]],
"exclud": [6],
"for": [11,8],
"fr": [5,4],
"pendant": [6,[5,10]],
"s\'effectu": [[8,10,11]],
"contenu": [11,[3,6],10,5,8,[0,9]],
"content": [5,11,3],
"effectuez": [10,[2,5,9]],
"vrir": [[3,8]],
"??critur": [[3,8]],
"alert": [5],
"applescript": [5],
"client": [6,10,[5,9,11]],
"exclus": [6,11],
"propri??t??s": [7],
"class": [11,2],
"d\'activ": [[8,11]],
"helplogmenuitem": [3],
"utilisation": [7],
"slov??n": [9],
"non-traduit": [11],
"editoverwritetranslationmenuitem": [3],
"outputfilenam": [5],
"go": [5],
"non-n??cessair": [11],
"laiss": [11],
"aeiou": [2],
"int??ress": [10,[4,11]],
"n\'appr??ciez": [11],
"form": [11,6,[5,8,10],3],
"courants": [7],
"defaut": [1],
"attach??": [11],
"d\'alert": [2],
"orthographi??": [4],
"trait??": [11,5,6],
"optionnel": [8,1],
"localis??": [6,9],
"rassembl??": [11],
"fourni": [11,[5,8]],
"hh": [6],
"duser.languag": [5],
"sauvegard": [6,[5,10]],
"vert": [9,8],
"??viter": [6,11],
"sp??cifiqu": [11,10,[6,8],5,[2,9]],
"bis": [2],
"d\'expressions": [7],
"file-target-encod": [11],
"projectopenmenuitem": [3],
"autom": [5],
"d??": [5],
"context": [[9,11],[3,6,8]],
"cr??ation": [[6,11]],
"issus": [11],
"https": [6,5,[9,11]],
"id": [11],
"if": [11],
"project_stats.txt": [11],
"v??rifieront": [5],
"ocr": [6],
"entr??": [11,8,3,1,[5,6,9]],
"s??lectif": [6],
"projectaccesscurrenttargetdocumentmenuitem": [3],
"toolsvalidatetagsmenuitem": [3],
"il": [11,6,5,10,4,9,1,8,[2,3],7],
"in": [11],
"termin": [5,[8,9,11]],
"ip": [5],
"consonn": [2],
"is": [2],
"d\'avoir": [11,5,6],
"attribu": [5],
"mat??riel": [6],
"odf": [6,11],
"compl??tement": [6],
"mod??l": [[2,11]],
"odg": [6],
"ex??cution": [7],
"ja": [5],
"acc??d": [11],
"je": [5,11],
"selon": [[5,11]],
"odt": [6,11],
"gotonexttranslatedmenuitem": [3],
"viewmarktranslatedsegmentscheckboxmenuitem": [3],
"jj": [6],
"paragraph": [11,8,6],
"valu": [1],
"eux-m??m": [[6,11]],
"nplural": [11],
"s\'attendr": [5],
"js": [11],
"ilia": [5],
"n\'??tai": [11],
"d??j??": [11,[5,6],[8,9],[4,10],[1,3]],
"learned_words.txt": [10],
"clavier": [3,11,[8,9]],
"s??lection": [8,11,3,[0,9]],
"red??finir": [11],
"reprendr": [11],
"affich": [8,11,[3,9],5,6,[1,2,4,10]],
"table": [7],
"macos": [7],
"ftl": [5],
"m??moir": [6,11,10,5,9,8,2],
"ftp": [11],
"editselectfuzzy1menuitem": [3],
"portant": [[6,10]],
"agr??ger": [11],
"actuell": [[5,8,9,11]],
"viewdisplaymodificationinfoallradiobuttonmenuitem": [3],
"draw": [6],
"placez": [10,[4,6]],
"cherch": [11],
"conserv??": [5,[10,11]],
"compress??": [10],
"hide": [11],
"op??rateur": [2],
"la": [11,6,5,8,9,3,10,2,4,1,0,7],
"s\'agit": [[6,11],[0,9,10]],
"placer": [[3,6,8,10,11]],
"sensibl": [11],
"automatique": [7],
"le": [11,6,5,8,9,10,1,2,[3,4],0,7],
"dswing.aatext": [5],
"dictionnaires": [7],
"auto": [10,8,11,6,3],
"fur": [6],
"habituell": [[8,11]],
"cons??cutif": [11],
"l\'endroit": [8,9],
"ordr": [11],
"sign": [[1,9]],
"probl??mes": [7],
"lu": [2],
"document.xx.docx": [11],
"majorit??": [11],
"red??marr": [11],
"int??grer": [8],
"mot-cl??": [11],
"l\'interfac": [5,6,[1,11]],
"second": [11,[3,5,6,8,9]],
"suffit": [[4,5,10],[9,11]],
"survient": [5],
"cycleswitchcasemenuitem": [3],
"son": [11,5,8,[1,6],9,0],
"l\'export": [6],
"pr??cis": [[3,11]],
"oracl": [5,3,11],
"suffir": [11],
"sp??cificateur": [2],
"ailleur": [5],
"r??guli??res": [7],
"limit": [11,[2,5]],
"survienn": [11],
"omegat.png": [5],
"d\'erreur": [5,6],
"autr": [6,5,11,[2,8,9],[1,4,10]],
"r??serv??": [4],
"gradlew": [5],
"mm": [6],
"interactif": [2],
"mn": [6],
"entri": [[8,11]],
"mo": [5],
"level": [6],
"mr": [11],
"ms": [11],
"mt": [10,11],
"lemmatiseur": [11],
"partant": [11],
"essai": [11],
"graphiques": [7],
"modif": [11,6,[3,5,10],8,1],
"my": [5],
"plus": [11,5,9,[2,6],10,[4,8],1,[0,3,7]],
"d??marrage": [7],
"conseill??": [11],
"ne": [11,6,5,[1,8],4,[2,3,9],10],
"permettra": [11,8],
"essay": [11],
"rencontr??": [0,[6,10]],
"veut": [6],
"ni": [9,5],
"param??trag": [5],
"nl": [6],
"syst??mes": [7],
"recherchez": [[0,5]],
"bon": [[0,4,11]],
"no": [11,10],
"sup??rieur": [[9,11]],
"d??clarat": [11],
"code": [3,4,11,5,6],
"n\'appara??tra": [8],
"reconna??tr": [[6,11]],
"d??finit": [3,[8,11]],
"??vite": [11],
"gotohistoryforwardmenuitem": [3],
"importez": [6],
"pouvant": [11],
"prennent": [[6,11]],
"d\'accueil": [6],
"contr??l": [6,8,[2,3]],
"switch": [11],
"total": [9,11,6],
"utiliser": [7],
"d??cid??": [11],
"of": [[0,11]],
"d??finir": [11,[2,4,8,9]],
"d??compressez": [5],
"possibl": [11,5,[6,9],2,[8,10],[1,3,4]],
"appara??tr": [[4,5]],
"pr??sentent": [10],
"ok": [[5,8]],
"on": [[6,8,11],[3,5]],
"dessous": [[5,11]],
"macro": [11],
"valeur": [11,2,5,1],
"clair": [8],
"src": [6],
"ou": [11,6,5,8,2,9,3,1,[0,4],10],
"d??placera": [11],
"incluront": [6],
"control": [3],
"ins??cabl": [[8,11],3],
"double-cliquez": [5],
"utilisez": [6,5,11,[1,8],[0,9]],
"d??marrera": [5],
"no-team": [[5,6]],
"charg??": [[5,6,11]],
"stylistiqu": [11],
"alphab??tiqu": [11],
"editinserttranslationmenuitem": [3],
"pc": [5],
"l??": [11],
"connus": [6],
"emp??cher": [11],
"pi": [11],
"l\'avez": [5],
"restent": [10,5],
"d??tacher": [9],
"correspondant": [11,[1,5]],
"encor": [[5,11],8],
"po": [11,9,5],
"d??termin??": [11],
"correspondra": [[2,11]],
"inclur": [11,6],
"optionsglossarystemmingcheckboxmenuitem": [3],
"inclut": [[2,5,9]],
"pt": [[4,5]],
"inclus": [[6,11],2],
"finissez": [6],
"r??cup??rer": [11],
"optionsautocompleteglossarymenuitem": [3],
"calcul??": [11,9],
"faibl": [11],
"d??criron": [6],
"z??ro": [[2,11]],
"formatag": [11,6,10],
"d\'occurr": [11],
"montrant": [11],
"l??gislat": [6],
"qu": [[6,11],5],
"filtrer": [11],
"edit": [11,8,3,9],
"d\'ajout": [11],
"ancienn": [[5,6]],
"resteront": [[10,11]],
"v??rificateur": [4,11,7,10,[1,2]],
"editselectfuzzy5menuitem": [3],
"br??silien": [4],
"l\'appell": [5],
"bilingu": [[6,11]],
"receviez": [5],
"kde": [5],
"d\'agrandiss": [9],
"t??l??chargement": [5],
"rc": [5],
"redimensionn": [[9,11]],
"includ": [6],
"principale": [7],
"fen??tres": [7],
"l\'adress": [5],
"minut": [6,[8,11]],
"nouvel": [[5,11]],
"access": [3,[0,5,6,8,11]],
"trouverez": [5,6],
"languag": [[5,11]],
"d??cide": [11],
"distingu": [10],
"sa": [11,9,6,[5,8]],
"disposit": [9],
"sc": [2],
"sur": [11,5,[6,9],8,3,4,1,10],
"se": [8,11,9,6,[5,10],[3,4]],
"bleu": [[9,11]],
"si": [11,8,5,6,[4,10],9,[2,3],[0,1]],
"oubli??": [0],
"quelqu": [[5,6,11]],
"key": [[5,11]],
"inscrir": [5],
"l\'??l??ment": [3],
"obtiendrez": [[6,11]],
"intern": [[9,11],8],
"mots-cl??": [11],
"svg": [5],
"celle-ci": [11,6,9],
"o??": [8,11,[5,6],9],
"svn": [6,10],
"quitt": [10],
"divis??": [11],
"quell": [[4,11],[2,5,9,10]],
"suivent": [2],
"editoverwritesourcemenuitem": [3],
"inscrit": [[5,11]],
"dialogues": [7],
"donn??es": [7],
"confirm": [11,[8,10]],
"l\'identif": [11],
"l\'objet": [11],
"sous-dossi": [10,6,11,5,[0,1,4]],
"ont": [11,8,6,[1,9,10]],
"enforc": [10],
"s\'av??rer": [[6,10,11]],
"d\'??tre": [6,5,[9,11]],
"remov": [5],
"associ??": [[5,8]],
"tm": [10,6,8,[7,9,11]],
"vast": [[4,11]],
"to": [[5,11]],
"v2": [5],
"sujet": [6,[10,11]],
"soumi": [0],
"editreplaceinprojectmenuitem": [3],
"but": [5],
"symbol": [2],
"document.xx": [11],
"tw": [5],
"aide": [7],
"dialogu": [11,8,10,[1,4,6,9]],
"valid??": [8,[9,11]],
"express": [2,11,5,[3,4]],
"trouv": [8,[10,11],[2,3,5,6,9]],
"r??daction": [6],
"s??r": [[6,9,10],11],
"corrig": [8],
"viewmarkautopopulatedcheckboxmenuitem": [3],
"projectwikiimportmenuitem": [3],
"countri": [5],
"plein": [11],
"jour": [11,6,[1,5,8,10]],
"communaut??": [6],
"distribu??": [5,11],
"??tes": [[5,6],[9,10,11]],
"utilisateur": [5,11,6,[1,2,8,10]],
"tableaux": [[3,6,7]],
"variant": [11],
"un": [11,6,5,8,[2,9],1,4,10,3,0,7],
"l\'en-t??t": [11],
"fichier_de_configur": [5],
"gotoprevioussegmentmenuitem": [3],
"d??sirez": [[5,6]],
"toujour": [11,[1,6],[3,8]],
"assurez-v": [5,4,6],
"s??lectionnez-l": [5],
"l\'encodag": [11,1],
"devront": [[6,11]],
"d??p??t": [6,8,[5,11]],
"solut": [[6,11]],
"d\'align": [11,8],
"this": [2],
"gotopreviousnotemenuitem": [3],
"va": [11,[4,5,6,8,10]],
"editredomenuitem": [3],
"uilayout.xml": [10],
"substitut": [8],
"ext??rieur": [[1,8]],
"vi": [5],
"fermer": [11,[3,8]],
"soient": [10,[4,6,11]],
"??-d": [11,8],
"d??sactiv": [[8,11]],
"renomm??": [6],
"d??tect??": [6],
"am??lior??": [11],
"fermez": [[6,8]],
"support": [6],
"jamai": [11],
"forc??": [10],
"libr": [[0,8,11]],
"coin": [9],
"changez": [11],
"deviez": [4],
"sein": [6],
"disposez": [[4,5,6,11]],
"copiez-l": [6],
"lisez-moi": [[5,11]],
"encourag??": [6],
"changer": [11,6],
"deux": [11,[5,6],8,4,9,10],
"appelon": [11],
"lien": [[0,5,11]],
"apport": [11],
"licenc": [[0,5,6,8]],
"groovy.codehaus.org": [11],
"auront": [11],
"lieu": [8],
"ex??cut??": [5,8],
"normal": [5,11,[1,10]],
"n\'arrivera": [6],
"emac": [5],
"org": [6],
"reconnus": [1,11],
"distribut": [5],
"??valu??": [11],
"li??e": [11],
"l\'ic??n": [5],
"diff??rem": [11],
"d??termin": [4],
"xf": [5],
"quitt??": [8],
"d??marr": [5],
"remplacement": [7],
"lentement": [5],
"additionnell": [11],
"litt??ral": [11],
"remarquez": [6,5,[4,10,11],0],
"choix": [5,11,4],
"xx": [5,11],
"restaur": [8,[6,9,11]],
"xy": [2],
"runtim": [5],
"sourc": [11,6,8,9,[3,10],5,1],
"d\'absenc": [8],
"d??marr??": [[2,5]],
"tester": [2],
"extrait": [11],
"extrair": [0],
"ressourc": [[6,11],5],
"type": [11,6,[3,5,8,10]],
"aligner": [7],
"techniqu": [11,8],
"beaucoup": [2],
"toolssinglevalidatetagsmenuitem": [3],
"secondair": [10,9],
"d??cochant": [11],
"obligera": [11],
"lign": [5,11,[2,9],3,[6,8,10],4,1],
"filenam": [11],
"souri": [[8,9]],
"g??n??ration": [11],
"??ventuell": [6],
"technologi": [5],
"cr??era": [11,5],
"l\'ajout": [5,11,[1,4,6,9]],
"commentair": [11,9,[1,5],[3,8]],
"projectaccesssourcemenuitem": [3],
"guide": [7],
"l\'except": [2,6],
"yy": [9,11],
"proposit": [11],
"comm": [11,6,5,9,8,[0,10],[3,4]],
"avez-v": [5],
"gotosegmentmenuitem": [3],
"raison": [[4,8,10]],
"sombr": [11],
"dans": [7],
"push": [6],
"zh": [6],
"exist": [11,[1,5],6,[4,8]],
"propr": [11,9,2],
"readme_tr.txt": [6],
"d\'oscil": [6],
"intact": [10],
"propo": [[3,8]],
"pr??ciser": [5,4],
"penalti": [10],
"repr??sent": [11,5],
"exact": [11,[1,8],4],
"xx_yy.tmx": [6],
"pr??cisez": [5],
"l\'aller-retour": [6],
"pr??d??fini": [11,[2,5]],
"confirm??": [[2,3,11]],
"oui": [5],
"soulign": [1],
"retour": [2,[9,11]],
"utf8": [1,[8,11]],
"helpaboutmenuitem": [3],
"espagnol": [4],
"copi": [6,[8,11],10],
"valabl": [11],
"cor??en": [11],
"depui": [[5,9,10,11],[4,6,8]],
"int??r??t": [5],
"l\'invers": [11],
"impl??ment": [5],
"pourcentag": [9,11,10],
"place": [11,[3,5,6]],
"power": [11],
"quand": [6,11,5],
"regular": [11],
"longu": [11],
"c\'est": [11,8,[2,5,9]],
"tag-valid": [5],
"invers??": [11],
"??v??nement": [3],
"chemin": [5,6],
"suggest": [[8,11],[3,4,9,10]],
"p??rennit??": [10],
"site": [11,10],
"demandera": [11],
"exportez-l": [6],
"r??ellement": [8],
"u0009": [2],
"xhh": [2],
"entendu": [[5,11]],
"s\'??crivant": [6,7],
"qu\'import": [6],
"revis": [0],
"u0007": [2],
"utilitair": [5],
"repositori": [6,10],
"minimum": [11],
"date": [11,8],
"argument": [5],
"lowercasemenuitem": [3],
"wiki": [[0,9]],
"avez": [5,11,[4,6,9],8,[0,3,10]],
"firefox": [[4,11]],
"feuill": [11],
"separ": [1],
"tab": [1,3,[8,11],9],
"quatr": [[6,8]],
"taa": [11,8],
"mesur": [11,5,[4,6]],
"int??ragit": [6],
"tag": [11],
"l\'align": [11,5],
"replac": [9],
"??cras??": [[5,11]],
"??dit??": [3],
"faudra": [11],
"tao": [10],
"doivent": [11,6,5,3,[0,1,2,4]],
"tar": [5],
"parmi": [[8,11]],
"d??fectueux": [6],
"coller": [8,9],
"s\'appliqueront": [11],
"clic-droit": [[1,4,8,11]],
"prendront": [11],
"interm??diair": [6],
"projectreloadmenuitem": [3],
"serveur": [6,5,[10,11]],
"n\'ajout": [6],
"sugg??r??": [9],
"bloc": [2,11],
"choisit": [5],
"choisir": [3,8,[5,11],6],
"obliqu": [5],
"tiendra": [5],
"contient-il": [0],
"install??": [5,[6,8],[4,11]],
"safe": [11],
"openoffic": [4,11],
"navig": [[5,11]],
"concevoir": [2],
"populair": [11],
"verra": [6],
"r??agira": [9],
"filtrag": [11],
"avec": [5,11,6,9,8,[1,10],[0,3]],
"note": [11,9,8,6,2,[3,10]],
"red??marrez": [3],
"optionsautocompletechartablemenuitem": [3],
"couleur": [[8,11],3],
"reproduir": [6],
"l\'ordr": [11,9,8],
"l\'identiqu": [11],
"winrar": [0],
"tbx": [1,11,3],
"ressemblera": [5],
"notr": [6],
"except??": [11],
"dynamiqu": [11],
"langues": [7],
"remont": [11],
"git": [6,[5,10]],
"cas": [6,11,5,10,[8,9],2],
"l\'une": [9,11],
"car": [11,[5,9]],
"plac??": [8,[6,11]],
"ouvrira": [[8,11]],
"duser.countri": [5],
"tcl": [11],
"tck": [11],
"plage": [2],
"xx-yy": [11],
"non-avid": [2],
"readm": [5,11],
"d??fini": [[6,11],[5,10],[3,4,8,9]],
"dispara??tront": [4],
"virgul": [[2,11],1],
"match": [8],
"consid??r??": [11,9],
"intens": [8],
"categori": [2],
"intent": [11],
"pr??senter": [11],
"probl??m": [1,[6,8],0,5],
"optionsspellcheckmenuitem": [3],
"passent": [11],
"parfait": [[6,8,11]],
"tableau": [2,3,11,9,1],
"l\'autr": [[8,11],[6,9]],
"accompli": [6],
"align.tmx": [5],
"confidentialit??": [[5,11]],
"commentaires": [7],
"optionssetupfilefiltersmenuitem": [3],
"contrair": [6],
"aupr??": [11]
};
