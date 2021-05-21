/**
 * 计算CRC16校验码
 * x16+x15+x2+1 = A001
 * @param bytes
 * @return
 */
function getCRC(bytes) {
    var CRC = 0x0000ffff;
    var POLYNOMIAL = 0x0000a001;

    var i, j;
    for (i = 0; i < bytes.length; i++) {
        CRC ^= (parseInt(bytes[i]) & 0x000000ff);
        for (j = 0; j < 8; j++) {
            if ((CRC & 0x00000001) != 0) {
                CRC >>= 1;
                CRC ^= POLYNOMIAL;
            } else {
                CRC >>= 1;
            }
        }
    }
    return padLeft(CRC.toString(16).toUpperCase(),'0',4);
}

/**
 * 计算CRC8校验码
 * X7+X6+X5+X2+1 = E5
 * @param bytes
 */
function getCRC8(bytes) {
    var crc = 0x0;
    for (var bt in bytes)
    {
        crc = crc ^ bt;
        for (var j = 1; j <= 8; j++)
        {
            if ((crc & 0x80) == 0x80){
                //多项式值为 E5,被校验值左移
                crc = (crc << 1) ^ 0xE5;
            }
            else{
                crc = crc << 1;
            }
        }
    }
    return crc.toString(16).toUpperCase();
}

/**
 * 校验和
 * @param bytes 字节数组
 * @param offset 偏移量
 * @param len 长度
 * @param sum 对比和值
 * @returns {boolean}
 */
function checkSum(bytes,offset,len,sum) {
    var checksum = 0;
    for (var i = offset; i < offset + len; i++)
    {
        checksum += bytes[i];
    }

    while(checksum>255){
        checksum = checksum - 256;
    }

    while(checksum<0){
        checksum = checksum + 255 + 1;
    }

    while(sum<0){
        sum = 255 + sum + 1;
    }

    if (checksum == sum)
    {
        return true;
    }
    else {
        return false;
    }
}

/**
 * 计算校验和
 * @param bytes
 * @param offset
 * @param len
 * @returns {number}
 */
function getCheckSum(bytes,offset,len) {
    var checksum = 0;
    for (var i = offset; i < offset + len; i++)
    {
        checksum += bytes[i];
    }

    while(checksum>255){
        checksum = checksum - 256;
    }
    return checksum;
}

/**
 * BCC异或
 * @param bytes
 * @returns byte
 * @constructor
 */
function BCC(bytes) {
    var temp = bytes[0];

    for (var i = 1; i < bytes.length; i++) {
        temp ^= bytes[i];
    }

    return temp;
}