package com.carrie.demo.utils;

import java.nio.ByteBuffer;

/**
 * @author JIAY
 * 进制转换工具
 */
public final class BinaryConverter {

    /**
     * 16进制所有的位的字节数组
     */
    private final static byte[] hex = "0123456789ABCDEF".getBytes();

    /**
     * 字节转换为16进制字符串
     *
     * @param buff 字节数组
     * @return a String	16进制表示的字符串
     */
    public static String bytesToHexString(byte[] buff) {
        StringBuilder stringBuilder = new StringBuilder("");
        if (buff == null || buff.length <= 0) {
            return null;
        }
        for (int i = 0; i < buff.length; i++) {
            int v = buff[i] & 0xFF;
            String hv = Integer.toHexString(v);
            if (hv.length() < 2) {
                stringBuilder.append(0);
            }
            stringBuilder.append(hv);
        }
        return stringBuilder.toString().toUpperCase();
    }

    /**
     * 字节数组转换成十六进制字符串
     *
     * @param b
     * @return
     */
    public static String Bytes2HexString(byte[] b) {
        byte[] buff = new byte[2 * b.length];
        for (int i = 0; i < b.length; i++) {
            buff[2 * i] = hex[(b[i] >> 4) & 0x0f];
            buff[2 * i + 1] = hex[b[i] & 0x0f];
        }
        return new String(buff);
    }

    /**
     * 十六进制字符串转换成字节数组
     *
     * @param hexstr
     * @return
     */
    public static byte[] HexString2Bytes(String hexstr) {
        byte[] b = new byte[hexstr.length() / 2];
        int j = 0;
        for (int i = 0; i < b.length; i++) {
            char c0 = hexstr.charAt(j++);
            char c1 = hexstr.charAt(j++);
            b[i] = (byte) ((parse(c0) << 4) | parse(c1));
        }
        return b;
    }

    /**
     * 16进制char转换成整型
     *
     * @param c
     * @return
     */
    public static int parse(char c) {
        if (c >= 'a')
            return (c - 'a' + 10) & 0x0f;
        if (c >= 'A')
            return (c - 'A' + 10) & 0x0f;
        return (c - '0') & 0x0f;
    }

    /**
     * 字节转换为16进制
     *
     * @param buff 字节
     * @return a String	16进制
     */
    public static String byteToHex(byte buff) {
        int v = buff & 0xFF;
        String hv = Integer.toHexString(v).toUpperCase();
        if (hv.length() < 2) {
            hv = fill(hv, 2, '0');
        }
        return hv;
    }

    /**
     * @param strPart 字符串
     * @return 16进制字符串
     * @Title:string2HexString
     * @Description:字符串转16进制字符串
     */
    public static String string2HexString(String strPart) {
        StringBuffer hexString = new StringBuffer();
        for (int i = 0; i < strPart.length(); i++) {
            int ch = (int) strPart.charAt(i);
            String strHex = fillWithZeroBefore(Integer.toHexString(ch),2);
            hexString.append(strHex.toUpperCase());
        }
        return hexString.toString();
    }

    /**
     * @param src 16进制字符串
     * @return 字节数组
     * @throws
     * @Title:hexString2String
     * @Description:16进制字符串转字符串
     */
    public static String hexString2String(String src) {
        String temp = "";
        for (int i = 0; i < src.length() / 2; i++) {
            //System.out.println(Integer.valueOf(src.substring(i * 2, i * 2 + 2),16).byteValue());
            temp = temp + (char) Integer.valueOf(src.substring(i * 2, i * 2 + 2), 16).byteValue();
        }
        return temp;
    }

    /**
     * @param src
     * @return
     * @throws
     * @Title:char2Byte
     * @Description:字符转成字节数据char-->integer-->byte
     */
    public static Byte char2Byte(Character src) {
        return Integer.valueOf((int) src).byteValue();
    }

    /**
     * @param a   转化数据
     * @param len 占用字节数
     * @return
     * @throws
     * @Title:intToHexString
     * @Description:10进制数字转成16进制
     */
    public static String intToHexString(int a, int len) {
        len <<= 1;
        String hexString = Integer.toHexString(a);
        int b = len - hexString.length();
        if (b > 0) {
            for (int i = 0; i < b; i++) {
                hexString = "0" + hexString;
            }
        }
        return hexString;
    }

    /**
     * 十进制转十六进制，长度不够高位补0
     */
    public static String intToHexStringX2(int a){
        String hex = Integer.toHexString(a).toUpperCase();
        if(hex.length()%2 == 0){
            return hex;
        }else {
            return "0" + hex;
        }
    }

    /**
     * "7dd",4,'0'==>"07dd"
     *
     * @param input  需要补位的字符串
     * @param size   补位后的最终长度
     * @param symbol 按symol补充 如'0'
     * @return N_TimeCheck中用到了
     */
    public static String fill(String input, int size, char symbol) {
        while (input.length() < size) {
            input = symbol + input;
        }
        return input;
    }

    /**
     * 二进制字符串转16进制字符串
     *
     * @param bString
     * @return
     */
    public static String binaryString2hexString(String bString) {
        if (bString == null || bString.equals("") || bString.length() % 8 != 0)
            return null;
        StringBuffer tmp = new StringBuffer();
        int iTmp = 0;
        for (int i = 0; i < bString.length(); i += 4) {
            iTmp = 0;
            for (int j = 0; j < 4; j++) {
                iTmp += Integer.parseInt(bString.substring(i + j, i + j + 1)) << (4 - j - 1);
            }
            tmp.append(Integer.toHexString(iTmp));
        }
        return tmp.toString();
    }

    /**
     * 十六进制字符串转二进制字符串
     *
     * @param hexString
     * @return
     */
    public static String hexString2binaryString(String hexString) {
        if (hexString == null || hexString.length() % 2 != 0)
            return null;
        String bString = "", tmp;
        for (int i = 0; i < hexString.length(); i++) {
            tmp = "0000"
                    + Integer.toBinaryString(Integer.parseInt(hexString
                    .substring(i, i + 1), 16));
            bString += tmp.substring(tmp.length() - 4);
        }
        return bString;
    }

    public static byte[] int2Bytes(int num) {
        byte[] byteNum = new byte[4];
        for (int ix = 0; ix < 4; ++ix) {
            int offset = 32 - (ix + 1) * 8;
            byteNum[ix] = (byte) ((num >> offset) & 0xff);
        }
        return byteNum;
    }

    public static int bytes2Int(byte[] byteNum) {
        int num = 0;
        for (int ix = 0; ix < 4; ++ix) {
            num <<= 8;
            num |= (byteNum[ix] & 0xff);
        }
        return num;
    }

    private static ByteBuffer buffer = ByteBuffer.allocate(8);

    // byte 数组与 long 的相互转换
    public static byte[] longToBytes(long x) {
        buffer.putLong(0, x);
        return buffer.array();
    }

    public static long bytesToLong(byte[] bytes) {
        buffer.put(bytes, 0, bytes.length);
        buffer.flip();// need flip
        return buffer.getLong();
    }

    /**
     * 浮点转换为字节
     *
     * @param f
     * @return
     */
    public static byte[] float2byte(float f) {

        // 把float转换为byte[]
        int fbit = Float.floatToIntBits(f);

        byte[] b = new byte[4];
        for (int i = 0; i < 4; i++) {
            b[i] = (byte) (fbit >> (24 - i * 8));
        }

        // 翻转数组
        int len = b.length;
        // 建立一个与源数组元素类型相同的数组
        byte[] dest = new byte[len];
        // 为了防止修改源数组，将源数组拷贝一份副本
        System.arraycopy(b, 0, dest, 0, len);
        byte temp;
        // 将顺位第i个与倒数第i个交换
        for (int i = 0; i < len / 2; ++i) {
            temp = dest[i];
            dest[i] = dest[len - i - 1];
            dest[len - i - 1] = temp;
        }

        return dest;

    }

    /**
     * 字节转换为浮点
     *
     * @param b 字节（至少4个字节）
     * @param index 开始位置
     * @return
     */
    public static float byte2float(byte[] b, int index) {
        int l;
        l = b[index + 0];
        l &= 0xff;
        l |= ((long) b[index + 1] << 8);
        l &= 0xffff;
        l |= ((long) b[index + 2] << 16);
        l &= 0xffffff;
        l |= ((long) b[index + 3] << 24);
        return Float.intBitsToFloat(l);
    }

    /**
     * 字节数组反转
     *
     * @param originArray
     */
    public static void bytesReverse(byte[] originArray) {
        int length = originArray.length;
        byte temp = 0;
        for (int i = 0; i < length / 2; i++) {
            temp = originArray[i];
            originArray[i] = originArray[length - i - 1];
            originArray[length - i - 1] = temp;
        }
    }

    /**
     * 字符串反转
     * @param binstr
     * @return
     */
    public static String stringReverse(String binstr) {
        return new StringBuilder(binstr).reverse().toString();
    }

    /**
     * hex按字节反转
     *
     * @param hex
     */
    public static String hexReverse(String hex) {
        String tem = "";
        for (int i = hex.length(); i > 1; i = i - 2) {
            tem += hex.substring(i - 2, i);
        }
        return tem;
    }

    /**
     * 十六进制转二进制，位数不够补0
     *
     * @param hexString
     * @param len
     * @return
     */
    public static String hexTobinaString(String hexString, int len) {
        int intResult = Integer.parseInt(hexString, 16);
        String binaString = Integer.toBinaryString(intResult);
        return fillWithZeroBefore(binaString, len);
    }

    /**
     * 前补零到指定的位数
     *
     * @param inputStr 待补零字符串
     * @param length   指定的字符串目标长度
     * @return
     */
    public static String fillWithZeroBefore(String inputStr, int length) {

        StringBuilder sb = new StringBuilder();
        if (inputStr.length() < length) {
            for (int i = 0; i < length - inputStr.length(); i++) {
                sb.append("0");
            }
            sb.append(inputStr);
        } else {
            return inputStr;
        }

        return sb.toString();
    }

    public static String fillWithZeroAfter(String inputStr, int length) {

        StringBuilder sb = new StringBuilder();
        sb.append(inputStr);
        if (inputStr.length() < length) {
            for (int i = 0; i < length - inputStr.length(); i++) {
                sb.append("0");
            }

        } else {
            return inputStr;
        }
        return sb.toString();
    }

    /**
     * 16进制转ASCII字符
     * @param hex
     * @return
     */
    public static char hex2Char(String hex){
        int num = Integer.parseInt(hex,16);
        return (char)num;
    }

    /**
     * ASCII转16进制
     * @param ch
     * @return
     */
    public static String char2Hex(char ch){
        int num = ch;
        return intToHexStringX2(num);
    }

    /**
     * 16进制转ASCII十进制
     * @param hex
     * @return
     */
    public static int hex2CharInt(String hex){
        int num = Integer.parseInt(hex,16);
        return Character.getNumericValue((char)num);
    }

    /**
     * 16进制字符串转ASCII
     * @param hex
     * @return
     */
    public static String hexStr2ASCIIStr(String hex){
        StringBuilder stringBuilder = new StringBuilder();
        for(int i=0;i<hex.length()/2;i++){
            stringBuilder.append((char)Integer.parseInt(hex.substring(i*2,i*2+2),16));
        }
        return stringBuilder.toString();
    }

    /**
     * ASCII转16进制
     * @param str
     * @return
     */
    public static String asciiStr2HexStr(String str){
        StringBuilder stringBuilder = new StringBuilder();
        char[] chars = str.toCharArray();
        for(int i=0;i<chars.length;i++){
            stringBuilder.append(intToHexStringX2((int)chars[i]));
        }
        return stringBuilder.toString();
    }

}
