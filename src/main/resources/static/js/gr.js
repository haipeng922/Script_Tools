/**
 * 广饶罐区编解码脚本
 * 锋士物联网协议,锋士GPRS协议
 */

var calculator = {};

/**
 * 设备上报数据到物联网平台时调用此接口进行解码, 将设备的原始数据解码为符合规约定义的JSON格式数据。
 * 该接口名称和入参已经定义好，开发者只需要实现具体接口即可。
 * @param byte[] payload   设备上报的原始码流
 * @return string json     符合规约定义的JSON格式字符串
 */
calculator.decode = function (payload,args) {
    var jsonRoot = {};
    var bytes = payload;
    var fields = {};
    var body = {};
    var msg_type = "deviceReq";
    var subdev_code = args;
    var dev_addr = "";
    var dev_type = "";
    //GPRS终端长度开头结尾校验
    if(bytes.length==14 && (bytes[0]==71 && bytes[1]==80 && bytes[2]==82 && bytes[3]==83 && bytes[13]==13)){
        //GPRS握手
        var recStr = bytes2String(bytes);
        subdev_code = recStr.substring(0,10);
        dev_addr = subdev_code;
        dev_type = "FSGPRS";
    }else if(bytes.length == 42 && (bytes[0]==62 && bytes[1]==67 && bytes[2]==71 && bytes[3]==80 && bytes[4]==82 && bytes[5]==83 && bytes[41]==13)){
        //GPRS数据
        recStr = bytes2String(bytes);
        subdev_code = recStr.substring(2,12);
        dev_addr = subdev_code;
        dev_type = "FSGPRS";
        //模拟量
        var mnl0 = parseInt(byte2Hex(bytes[13]) + byte2Hex(bytes[12]),16)/100.00;
        var mnl1 = parseInt(byte2Hex(bytes[15]) + byte2Hex(bytes[14]),16)/100.00;
        var mnl2 = parseInt(byte2Hex(bytes[17]) + byte2Hex(bytes[16]),16)/100.00;
        var mnl3 = parseInt(byte2Hex(bytes[19]) + byte2Hex(bytes[18]),16)/100.00;
        //开关量
        var kglBinStr = padLeft(bytes[37].toString(2),'0',8);
        var kgl0 = parseInt(kglBinStr.substring(4,5));
        var kgl1 = parseInt(kglBinStr.substring(5,6));
        var kgl2 = parseInt(kglBinStr.substring(6,7));
        var kgl3 = parseInt(kglBinStr.substring(7));
        //转换实际数值
        var rangMin = 0;
        var rangMax = 1;
        var scopeMin = 1;
        var scopeMax = 5;
        fields["1#gsyali"] = (mnl0 - scopeMin) * (rangMax - rangMin) / (scopeMax - scopeMin) + rangMin;
        //如果有其它数值此处需要按现场实际情况(io表)添加
    }else if(subdev_code == "GPRS000001"){
        //汇中流量计modbus
        if(bytes.length == 31 && bytes[1] == 0x03){
            dev_type = "Modbus";
            dev_addr = bytes[0];
            //瞬时流量
            fields["1#gsssll"] = Bytes2IEEE745(bytes.slice(3,7))/1000.0;
            //累积流量
            fields["1#gsljll"] = BytesToInt32(bytes.slice(7,11),0)/10.0;
        }
    }else {
        //锋士物联网协议
        var csIsOk = checkSum(bytes,4,bytes.length - 6, bytes[bytes.length -2]);
        //console.log(csIsOk);
        if(csIsOk && bytes[0]==104 && bytes[bytes.length-1]==22){
            //信息体地址
            var frameType = Bytes2HexString(bytes.slice(10,12));
            fields["frameType"] = frameType;
            body["frameType"] = frameType;
            subdev_code = Bytes2HexString(bytes.slice(12,20));
            subdev_code = parseInt(subdev_code,16);
            dev_addr = subdev_code;
            dev_type = "FSRTU";
            if(frameType == "5006"){
                //设备上线
                //通道类型
                var channelType = bytes[20];
                fields["channelType"] = channelType;
                //设备类型
                var devType = bytes[21];
                fields["devType"] = devType;
                //连接方式
                var connMode = bytes[22];
                fields["connMode"] = connMode;
                //信号强度
                var signal = bytes[23];
                fields["signal"] = signal;
            }else if(frameType == "5008"){
                //设备心跳
            }else if(frameType == "4001"){
                //遥测数据上报
                var databytes = bytes.slice(20,bytes.length-2);
                var dataNum = databytes.length/6;//6个字节一个数值
                for(var dj=0;dj<dataNum;dj++){
                    var dbyte = databytes.slice(dj*6,dj*6+6);
                    var dtype = byte2ToUnsignedShort(dbyte.slice(0,2));
                    var datavalue = Bytes2IEEE745(dbyte.slice(2,6));
                    if(dtype == 31){//瞬时流量
                        fields["flow"] = datavalue;
                    }else if(dtype == 41){//累积流量
                        fields["cumulativeFlow"] = datavalue;
                    }
                }
            }else if(frameType == "5070" || frameType == "504A"){//泵状态错误上报/设备状态上报
                //村号
                var villageNum = Bytes2HexString(bytes.slice(20,26));
                fields["villageNum"] = parseInt(villageNum);
                //泵反馈状态 通道1
                fields["state_ch1"] = bytes[26];
                //设备时间
                var dateTimeBCD = Bytes2HexString(bytes.slice(27,33));
                fields["datetime"] = (parseInt(dateTimeBCD.substring(0,2)) + 2000) + "-" + dateTimeBCD.substring(2,4)
                    + "-" + dateTimeBCD.substring(4,6) + " " + dateTimeBCD.substring(6,8) + ":" + dateTimeBCD.substring(8,10)
                    + ":" + dateTimeBCD.substring(10);
                //最大通道数量
                var maxChannel = bytes[33];
                fields["maxChannel"] = maxChannel;
                //其它通道泵反馈状态
                var ch_index = 33;
                for(var ch=2;ch<=maxChannel;ch++){
                    ch_index++;
                    var ch_key = "state_ch" + ch;
                    fields[ch_key] = bytes[ch_index];
                }
            }else if(frameType == "5075" || frameType == "5076"
                || frameType == "5078" || frameType == "5079"){//用户开泵/关泵/恢复异常停泵/灌溉过程中定时 上报
                //村号
                var villageNum = Bytes2HexString(bytes.slice(20,26));
                fields["villageNum"] = parseInt(villageNum);
                //卡号
                var cardNum = Bytes2HexString(bytes.slice(26,30));
                fields["cardNum"] = cardNum;
                //序号
                fields["num"] = parseInt(Bytes2HexString(bytes.slice(30,34)),16);
                //余水
                fields["residualWater"] = parseInt(Bytes2HexString(bytes.slice(34,38)),16)/100;
                //余电
                fields["residualElectricity"] = parseInt(Bytes2HexString(bytes.slice(38,42)),16)/100;
                //卡状态
                fields["cardState"] = bytes[42];
                //设备时间
                var dateTimeBCD = Bytes2HexString(bytes.slice(43,49));
                fields["datetime"] = (parseInt(dateTimeBCD.substring(0,2)) + 2000) + "-" + dateTimeBCD.substring(2,4)
                    + "-" + dateTimeBCD.substring(4,6) + " " + dateTimeBCD.substring(6,8) + ":" + dateTimeBCD.substring(8,10)
                    + ":" + dateTimeBCD.substring(10);
                //备用字段 4byte
                //扣费方式
                fields["deduction"] = bytes[53];
                //余额
                fields["balance"] = parseInt(Bytes2HexString(bytes.slice(54,58)))/100;
                //用水
                fields["water"] = parseInt(Bytes2HexString(bytes.slice(58,62)),16)/100;
                //用电
                fields["electricity"] = parseInt(Bytes2HexString(bytes.slice(62,66)),16)/100;
                //水费率
                fields["waterRate"] = parseInt(Bytes2HexString(bytes.slice(66,70)))/100;
                //电费率
                fields["electricityRate"] = parseInt(Bytes2HexString(bytes.slice(70,74)))/100;
                //通道号
                fields["channelNum"] = bytes[74];
            }else if(frameType == "5077"){//异常停泵上报
                //村号
                var villageNum = Bytes2HexString(bytes.slice(20,26));
                fields["villageNum"] = parseInt(villageNum);
                //卡号
                var cardNum = Bytes2HexString(bytes.slice(26,30));
                fields["cardNum"] = cardNum;
                //序号
                fields["num"] = parseInt(Bytes2HexString(bytes.slice(30,34)),16);
                //余水
                fields["residualWater"] = parseInt(Bytes2HexString(bytes.slice(34,38)),16)/100;
                //余电
                fields["residualElectricity"] = parseInt(Bytes2HexString(bytes.slice(38,42)),16)/100;
                //卡状态
                fields["cardState"] = bytes[42];
                //异常原因
                fields["exception"] = bytes[43];
                //设备时间
                var dateTimeBCD = Bytes2HexString(bytes.slice(44,50));
                fields["datetime"] = (parseInt(dateTimeBCD.substring(0,2)) + 2000) + "-" + dateTimeBCD.substring(2,4)
                    + "-" + dateTimeBCD.substring(4,6) + " " + dateTimeBCD.substring(6,8) + ":" + dateTimeBCD.substring(8,10)
                    + ":" + dateTimeBCD.substring(10);
                //备用字段 4byte
                //扣费方式
                fields["deduction"] = bytes[54];
                //余额
                fields["balance"] = parseInt(Bytes2HexString(bytes.slice(55,59)))/100;
                //用水
                fields["water"] = parseInt(Bytes2HexString(bytes.slice(59,63)),16)/100;
                //用电
                fields["electricity"] = parseInt(Bytes2HexString(bytes.slice(63,67)),16)/100;
                //水费率
                fields["waterRate"] = parseInt(Bytes2HexString(bytes.slice(67,71)))/100;
                //电费率
                fields["electricityRate"] = parseInt(Bytes2HexString(bytes.slice(71,75)))/100;
                //通道号
                fields["channelNum"] = bytes[75];
            }else if(frameType == "5080"){//实时数据定时上报
                //村号
                var villageNum = Bytes2HexString(bytes.slice(20,26));
                fields["villageNum"] = parseInt(villageNum);
                //灌溉序号
                fields["num"] = parseInt(Bytes2HexString(bytes.slice(26,30)),16);
                //上报原因(保留) 1byte
                //瞬时流量通道1
                fields["flow_ch1"] = parseInt(Bytes2HexString(bytes.slice(31,35)),16)/100;
                //累积流量通道1
                fields["cumulativeFlow_ch1"] = parseInt(Bytes2HexString(bytes.slice(35,39)),16)/100;
                //设备时间
                var dateTimeBCD = Bytes2HexString(bytes.slice(39,45));
                fields["datetime"] = (parseInt(dateTimeBCD.substring(0,2)) + 2000) + "-" + dateTimeBCD.substring(2,4)
                    + "-" + dateTimeBCD.substring(4,6) + " " + dateTimeBCD.substring(6,8) + ":" + dateTimeBCD.substring(8,10)
                    + ":" + dateTimeBCD.substring(10);
                //累积电量(保留) 6byte
                //水位(保留) 6byte
                //压力(保留) 6byte
                //最大通道数量
                var maxChannel = bytes[63];
                fields["maxChannel"] = maxChannel;
                //其它通道流量
                var ch_index = 64;
                for(var ch=2;ch<=maxChannel;ch++){
                    var ch_key_flow = "flow_ch" + ch;
                    var ch_key_cumuFlow = "cumulativeFlow_ch" + ch;
                    fields[ch_key_flow] = parseInt(Bytes2HexString(bytes.slice(ch_index,ch_index + 4)),16)/100;
                    fields[ch_key_cumuFlow] = parseInt(Bytes2HexString(bytes.slice(ch_index + 4,ch_index + 8)),16)/100;
                    ch_index = ch_index + 8;
                }
            }else if(frameType == "5045"){
                //获取服务器时间
            }else if(frameType == "5081" || frameType == "5082"){
                //平台开泵/关泵命令响应
                msg_type = "deviceRsp";
                //村号
                var villageNum = Bytes2HexString(bytes.slice(20,26));
                body["villageNum"] = parseInt(villageNum);
                //卡号
                var cardNum = Bytes2HexString(bytes.slice(26,30));
                body["cardNum"] = cardNum;
                //开/关泵结果
                var result = bytes[30];
                body["result"] = result;
                if(result!=0x1f){//0x1f通道号错误，以下数据不准确
                    //序号
                    body["num"] = parseInt(Bytes2HexString(bytes.slice(31,35)),16);
                    //余水
                    body["residualWater"] = parseInt(Bytes2HexString(bytes.slice(35,39)),16)/100;
                    //余电
                    body["residualElectricity"] = parseInt(Bytes2HexString(bytes.slice(39,43)),16)/100;
                    //卡状态
                    body["cardState"] = bytes[43];
                    //设备接收命令时间
                    var cmdRecTimeBCD = Bytes2HexString(bytes.slice(44,50));
                    body["cmdRecTime"] = (parseInt(cmdRecTimeBCD.substring(0,2)) + 2000) + "-" + cmdRecTimeBCD.substring(2,4)
                        + "-" + cmdRecTimeBCD.substring(4,6) + " " + cmdRecTimeBCD.substring(6,8) + ":" + cmdRecTimeBCD.substring(8,10)
                        + ":" + cmdRecTimeBCD.substring(10);
                    //扣费方式
                    body["deduction"] = bytes[54];
                    //余额
                    body["balance"] = parseInt(Bytes2HexString(bytes.slice(55,59)))/100;
                    //用水
                    body["water"] = parseInt(Bytes2HexString(bytes.slice(59,63)),16)/100;
                    //用电
                    body["electricity"] = parseInt(Bytes2HexString(bytes.slice(63,67)),16)/100;
                    //水费率
                    body["waterRate"] = parseInt(Bytes2HexString(bytes.slice(67,71)))/100;
                    //电费率
                    body["electricityRate"] = parseInt(Bytes2HexString(bytes.slice(71,75)))/100;
                    //通道号
                    body["channelNum"] = bytes[75];
                }
            }else if(frameType == "5083"){
                msg_type = "deviceRsp";
                //村号
                var villageNum = Bytes2HexString(bytes.slice(20,26));
                body["villageNum"] = parseInt(villageNum);
                //卡号
                var cardNum = Bytes2HexString(bytes.slice(26,30));
                body["cardNum"] = cardNum;
                //通道号
                body["channelNum"] = bytes[30];
                //命令结果
                var result = bytes[31];
                body["result"] = result;
            }else if(frameType == "5084"){
                msg_type = "deviceRsp";
                //村号
                var villageNum = Bytes2HexString(bytes.slice(20,26));
                body["villageNum"] = parseInt(villageNum);
                //命令结果
                var result = bytes[26];
                body["result"] = result;
            }else if(frameType == "5085"){//设备配置信息
                msg_type = "deviceRsp";
                //村号
                var villageNum = Bytes2HexString(bytes.slice(20,26));
                body["villageNum"] = parseInt(villageNum);
                //服务器地址及端口号
                var ipPortArr = bytes.slice(26,32);
                var ip = bytes2ubytes(ipPortArr[3]) + "." + bytes2ubytes(ipPortArr[2]) + "." + bytes2ubytes(ipPortArr[1]) + "." + bytes2ubytes(ipPortArr[0]);
                var portArr = [ipPortArr[5],ipPortArr[4]];
                var port = parseInt(Bytes2HexString(portArr),16);
                body["ipPort"] = ip + " " + port;
                //灌溉过程中数据上报时间
                body["reportInterval"] = parseInt(Bytes2HexString(bytes.slice(32,34)),16);
                //流量上报时间
                body["flowReportInterval"] = parseInt(Bytes2HexString(bytes.slice(34,36)),16);
            }else if(frameType == "5090"){//设备上报压力信息
                //数据个数
                var dataCount = bytes[20];
                //数据种类 0x01:压力,0x03:压力和累积,0x07:压力累积和瞬时
                var dataTypeNum = bytes[21];
                var subIndex = 22;
                for(var i=0;i<dataCount;i++){
                    if(dataTypeNum == 0x01){
                        var tagYali = "yali" + (i + 1);
                        var tagDataTime = "datatime" + (i + 1);
                        fields[tagYali] = parseInt(Bytes2HexString(bytes.slice(subIndex,subIndex + 4)),16);
                        var dataTimeBCD = Bytes2HexString(bytes.slice(subIndex + 4,subIndex + 10));
                        fields[tagDataTime] = 2000 + parseInt(dataTimeBCD.substring(0,2)) + "-" + dataTimeBCD.substring(2,4) + "-" + dataTimeBCD.substring(4,6) + " " + dataTimeBCD.substring(6,8) + ":" + dataTimeBCD.substring(8,10) + ":" + dataTimeBCD.substring(10,12);
                        subIndex += 10;
                    }else if(dataTypeNum == 0x03){
                        var tagYali = "yali" + (i + 1);
                        var tagLjll = "ljll" + (i + 1);
                        var tagDataTime = "datatime" + (i + 1);
                        fields[tagYali] = parseInt(Bytes2HexString(bytes.slice(subIndex,subIndex + 4)),16);
                        fields[tagLjll] = parseInt(Bytes2HexString(bytes.slice(subIndex + 4,subIndex + 8)),16);
                        var dataTimeBCD = Bytes2HexString(bytes.slice(subIndex + 8,subIndex + 14));
                        fields[tagDataTime] = 2000 + parseInt(dataTimeBCD.substring(0,2)) + "-" + dataTimeBCD.substring(2,4) + "-" + dataTimeBCD.substring(4,6) + " " + dataTimeBCD.substring(6,8) + ":" + dataTimeBCD.substring(8,10) + ":" + dataTimeBCD.substring(10,12);
                        subIndex += 14;
                    }else if(dataTypeNum == 0x07){
                        var tagYali = "yali" + (i + 1);
                        var tagLjll = "ljll" + (i + 1);
                        var tagSsll = "ssll" + (i + 1);
                        var tagDataTime = "datatime" + (i + 1);
                        fields[tagYali] = parseInt(Bytes2HexString(bytes.slice(subIndex,subIndex + 4)),16);
                        fields[tagLjll] = parseInt(Bytes2HexString(bytes.slice(subIndex + 4,subIndex + 8)),16);
                        fields[tagSsll] = parseInt(Bytes2HexString(bytes.slice(subIndex + 8,subIndex + 12)),16)/100.0;
                        var dataTimeBCD = Bytes2HexString(bytes.slice(subIndex + 12,subIndex + 18));
                        fields[tagDataTime] = 2000 + parseInt(dataTimeBCD.substring(0,2)) + "-" + dataTimeBCD.substring(2,4) + "-" + dataTimeBCD.substring(4,6) + " " + dataTimeBCD.substring(6,8) + ":" + dataTimeBCD.substring(8,10) + ":" + dataTimeBCD.substring(10,12);
                        subIndex += 18;
                    }
                }
            }else if(frameType == "5091"){//设备上报报警信息
                //报警个数
                var alarmCount = bytes[20];
                var subIndex = 22;
                for(var i=0;i<alarmCount;i++){
                    //报警种类 b1:压力越限,b2:压力变幅越限,b3:电池电量低,b4:流量计流量超时(485通信失败),b5:流量计累积超时
                    var alarmTypeNum = bytes[subIndex + 1];
                    if(alarmTypeNum == 0x01){
                        fields["alarm_yali"] = 1;
                        fields["yali"] = parseInt(Bytes2HexString(bytes.slice(subIndex,subIndex + 4)),16);
                    }else if(alarmTypeNum == 0x02){
                        fields["alarm_yalibf"] = 1;
                        fields["yalibf"] = parseInt(Bytes2HexString(bytes.slice(subIndex,subIndex + 4)),16);
                    }else if(alarmTypeNum == 0x04){
                        fields["alarm_dl"] = 1;
                        fields["dy"] = parseInt(Bytes2HexString(bytes.slice(subIndex,subIndex + 2)),16);
                        fields["dl"] = parseInt(Bytes2HexString(bytes.slice(subIndex + 2,subIndex + 4)),16);
                    }else if(alarmTypeNum == 0x08){
                        fields["alarm_ssll"] = 1;
                        fields["ssll"] = parseInt(Bytes2HexString(bytes.slice(subIndex,subIndex + 4)),16)/100.0;
                    }else if(alarmTypeNum == 0x10){
                        fields["alarm_ljll"] = 1;
                        fields["ljll"] = parseInt(Bytes2HexString(bytes.slice(subIndex,subIndex + 4)),16);
                    }
                    var dataTimeBCD = Bytes2HexString(bytes.slice(subIndex + 4,subIndex + 10));
                    fields[tagDataTime] = 2000 + parseInt(dataTimeBCD.substring(0,2)) + "-" + dataTimeBCD.substring(2,4) + "-" + dataTimeBCD.substring(4,6) + " " + dataTimeBCD.substring(6,8) + ":" + dataTimeBCD.substring(8,10) + ":" + dataTimeBCD.substring(10,12);
                    subIndex += 10;
                }
            }else if(frameType == "5092"){
                //平台读取配置命令响应
                msg_type = "deviceRsp";
                body["yali_lv"] = parseInt(Bytes2HexString(bytes.slice(20,24)),16);
                body["yalibf_lv"] = parseInt(Bytes2HexString(bytes.slice(24,28)),16);
            }else if(frameType == "5093"){
                //平台下发配置响应
                msg_type = "deviceRsp";
                var result = bytes[20];
                body["result"] = result;
            }else if(frameType == "5060"){//平台获取软件版本号响应
                msg_type = "deviceRsp";
                var len = bytes[20];
                var oldVersion = bytes2String(bytes.slice(21,21 + len));
                body["oldVersion"] = stringHiddenCharactersTrim(oldVersion);
            }else if(frameType == "5061"){//平台发送新版本响应
                msg_type = "deviceRsp";
                body["result"] = bytes[20];
            }else if(frameType == "5062"){//设备获取分包请求
                //版本号长度
                var versionLen = bytes[20];
                console.log(versionLen);
                //fields["versionLen"] = versionLen;
                //版本号
                var newVersion = bytes2String(bytes.slice(21,21+versionLen));
                console.log(newVersion);
                fields["newVersion"] = stringHiddenCharactersTrim(newVersion);
                //分包序号
                fields["subpackageNum"] = parseInt(Bytes2HexString(bytes.slice(42,44)),16);
                //每包大小,最大1024
                fields["subpackageSize"] = parseInt(Bytes2HexString(bytes.slice(44,46)),16);
            }else if(frameType == "5063"){//设备上报远程升级状态
                //版本号长度
                var versionLen = bytes[20];
                //版本号
                var newVersion = bytes2String(bytes.slice(21,21+versionLen));
                fields["newVersion"] = stringHiddenCharactersTrim(newVersion);
                //接收状态,01接收成功
                fields["recState"] = bytes[42];
            }else if(frameType == "502C"){
                //透传（GPRS兼容）
                dev_type = "Modbus";
                //设备地址
                var devAddr = bytes[20];
                dev_addr = devAddr;
                //功能码
                var funCode = bytes[21];
                var dataLen = bytes[22];
                //读瞬时流量（浮点数）
                fields["1#gsssll"] = Bytes2IEEE745(bytes.slice(45,45+4),"L");
                //读累积流量
                //累积流量百万位
                var ljll_million = parseInt(Bytes2HexString(bytes.slice(23,25)),16);
                fields["1#gsljll"] = ljll_million * 1000000 + Bytes2IEEE745(bytes.slice(57,57+4),"L");
            }
        }
    }
    jsonRoot["msg_type"] = msg_type;
    jsonRoot["subdev_code"] = subdev_code;
    jsonRoot["dev_addr"] = dev_addr;
    jsonRoot["dev_type"] = dev_type;
    if(msg_type == "deviceReq"){
        jsonRoot["fields"] = fields;
    }
    if(msg_type == "deviceRsp"){
        jsonRoot["body"] = body;
    }
    return JSON.stringify(jsonRoot);
}

/**
 * 物联网平台下发指令时，调用此接口进行编码, 将符合规约定义的JSON格式数据编码为设备的原始码流。
 * 该接口名称和入参格式已经定义好，开发者只需要实现具体接口即可。
 * @param string json      符合规约定义的JSON格式字符串
 * @return byte[] payload  编码后的原始码流
 */
function encode(json,args) {
    json = JSON.parse(json);
    var payload = [];
    var tm_code = json["tm_code"];
    var msg_type = json["msg_type"];
    if(msg_type == "cloudRsp"){
        var request = json["request"];
        //var bytes = HexString2Bytes(request);
        var bytes = request;
        var csIsOk = checkSum(bytes,4,bytes.length - 6, bytes[bytes.length -2]);
        if(csIsOk && bytes[0]==104 && bytes[bytes.length-1]==22){
            //控制域
            var cByte = parseInt("01000001",2);
            payload.push(cByte);
            //地址域
            payload.push(1);
            //类型标识
            payload.push(3);
            //信息元素个数
            payload.push(1);
            //传输原因
            payload.push(7);
            //公共地址
            payload.push(1);
            //信息体地址
            payload = payload.concat(bytes.slice(10,12));
            //终端编号
            payload = payload.concat(bytes.slice(12,20));
            //信息体地址
            var frameType = Bytes2HexString(bytes.slice(10,12));
            if(frameType == "5006" || frameType == "5091"){
                //执行结果
                payload.push(1);
            }else if(frameType == "5008"){
                //只一个设备号
            }else if(frameType == "4001"){
                //类型标识
                payload[2] = 0x0B;
                //信息元素个数
                payload[3] = bytes[7];
                //执行结果
                payload.push(1);
            }else if(frameType=="5045"){//获取服务器时间
                //年月日时分秒
                var nowObj = new Date();
                var year = nowObj.getFullYear();
                payload = payload.concat(unsignedShortToByte2(parseInt(year)));
                payload.push(nowObj.getMonth() + 1);
                payload.push(nowObj.getDate());
                payload.push(nowObj.getHours());
                payload.push(nowObj.getMinutes());
                payload.push(nowObj.getSeconds());
            }else if(frameType == "5081"){
                //不需要响应返回空payload
            }else if(frameType == "5070" || frameType == "5080"){//泵状态错误状态/实时数据 上报响应
                //村号
                payload = payload.concat(bytes.slice(20,26));
                //执行结果
                payload.push(1);
            }else if(frameType == "504A"){//设备状态上报响应
                //村号
                payload = payload.concat(bytes.slice(20,26));
                //卡号(预留),4 byte
                payload.push(0,0,0,0);
                //执行结果
                payload.push(1);
            }else if(frameType == "5075" || frameType == "5076"
                || frameType == "5077" || frameType == "5078"
                || frameType == "5079" ){//用户开泵/关泵/异常停泵/恢复异常停泵/灌溉过程中数据定时 上报响应
                //村号
                payload = payload.concat(bytes.slice(20,26));
                //卡号
                payload = payload.concat(bytes.slice(26,30));
                //执行结果
                payload.push(1);
            }else if(frameType == "5090"){
                //执行结果
                payload.push(1);
                //6byte BCD平台时间
                var nowObj = new Date();
                var year = nowObj.getFullYear();
                payload = payload.concat(parseInt(year)-2000);
                payload.push(nowObj.getMonth() + 1);
                payload.push(nowObj.getDate());
                payload.push(nowObj.getHours());
                payload.push(nowObj.getMinutes());
                payload.push(nowObj.getSeconds());
            }else {
                //不需要响应的情况,eg:设备获取分包应答,由调试用户以下发
                payload = [];
                return payload;
            }
            //长度
            var len = payload.length;
            payload.unshift(parseInt("68",16));
            var lenBytes = HexString2Bytes(padLeft(len.toString(16),'0',4));
            payload.unshift(lenBytes[0],lenBytes[1]);
            payload.unshift(parseInt("68",16));
            //校验
            var cs = getCheckSum(payload,4, len);
            payload.push(cs,parseInt("16",16));
        }else {
            //透传协议不需要响应 payload = []
        }
    }else if(msg_type == "cloudReq"){
        var cmd = json["command"];
        var cmd_name = cmd["cmd_name"];
        var paras = cmd["params"];
        //控制域
        var cByte = parseInt("01000001",2);
        payload.push(cByte);
        //地址域
        payload.push(1);
        //类型标识
        payload.push(3);
        //信息元素个数
        payload.push(1);
        //传输原因
        payload.push(7);
        //公共地址
        payload.push(1);
        if(cmd_name == "C_DEVICE_CONTROL_REBOOT"){//远程重启
            //传输原因
            payload[5] = 6;
            //信息体地址
            payload = payload.concat(HexString2Bytes("5005"));
            //终端编号
            var devCodeHex = padLeft(parseInt(paras["devCode"]).toString(16),'0',16);
            payload = payload.concat(HexString2Bytes(devCodeHex));
            //重启
            payload.push(1);
        }else if(cmd_name == "C_DEVICE_CONTROL_PUMP_ON"){//平台开泵命令
            //信息体地址
            payload = payload.concat(HexString2Bytes("5081"));
            //终端编号
            var devCodeHex = padLeft(parseInt(paras["devCode"]).toString(16),'0',16);
            payload = payload.concat(HexString2Bytes(devCodeHex));
            //村号 6byte BCD
            var villageNumHex = padLeft(paras["villageNum"],'0',12);
            payload = payload.concat(HexString2Bytes(villageNumHex));
            //卡号 4byte BCD
            var cardNumHex = padLeft(paras["cardNum"],'0',8);
            payload = payload.concat(HexString2Bytes(cardNumHex));
            //余水 4byte
            var residualWaterHex = padLeft((parseFloat(paras["residualWater"])*100).toString(16),'0',8);
            console.log(residualWaterHex);
            payload = payload.concat(HexString2Bytes(residualWaterHex));
            //余电 4byte
            var residualElectricityHex = padLeft((parseFloat(paras["residualElectricity"])*100).toString(16),'0',8);
            payload = payload.concat(HexString2Bytes(residualElectricityHex));
            //余额 4byte BCD
            var balanceHex = padLeft((parseFloat(paras["balance"])*100).toString(16),'0',8);
            payload = payload.concat(HexString2Bytes(balanceHex));
            //通道号 1byte
            payload.push(parseInt(paras["channelNum"]));
        }else if(cmd_name == "C_DEVICE_CONTROL_PUMP_OFF"){//平台关泵
            //信息体地址
            payload = payload.concat(HexString2Bytes("5082"));
            //终端编号
            var devCodeHex = padLeft(parseInt(paras["devCode"]).toString(16),'0',16);
            payload = payload.concat(HexString2Bytes(devCodeHex));
            //村号 6byte BCD
            var villageNumHex = padLeft(paras["villageNum"],'0',12);
            payload = payload.concat(HexString2Bytes(villageNumHex));
            //卡号 4byte BCD
            var cardNumHex = padLeft(paras["cardNum"],'0',8);
            payload = payload.concat(HexString2Bytes(cardNumHex));
            //通道号 1byte
            payload.push(parseInt(paras["channelNum"]));
        }else if(cmd_name == "C_DEVICE_CONTROL_PUMP_STOP_CANCEL"){//平台取消异常停泵
            //信息体地址
            payload = payload.concat(HexString2Bytes("5083"));
            //终端编号
            var devCodeHex = padLeft(parseInt(paras["devCode"]).toString(16),'0',16);
            payload = payload.concat(HexString2Bytes(devCodeHex));
            //村号 6byte BCD
            var villageNumHex = padLeft(paras["villageNum"],'0',12);
            payload = payload.concat(HexString2Bytes(villageNumHex));
            //卡号 4byte BCD
            var cardNumHex = padLeft(paras["cardNum"],'0',8);
            payload = payload.concat(HexString2Bytes(cardNumHex));
            //通道号 1byte
            payload.push(parseInt(paras["channelNum"]));
        }else if(cmd_name == "C_DEVICE_CONTROL_CONFIG_WRITE"){//平台下发设备配置
            payload = payload.concat(HexString2Bytes("5084"));
            //终端编号
            var devCodeHex = padLeft(parseInt(paras["devCode"]).toString(16),'0',16);
            payload = payload.concat(HexString2Bytes(devCodeHex));
            //村号 6byte BCD
            var villageNumHex = padLeft(paras["villageNum"],'0',12);
            payload = payload.concat(HexString2Bytes(villageNumHex));
            //服务器地址及端口号 xxxx.xxxx.xxxx.xxxx xxxx
            var ipPort = paras["ipPort"].split(' ');
            var ipArr = ipPort[0].split('.');
            payload.push(parseInt(ipArr[3]),parseInt(ipArr[2]),parseInt(ipArr[1]),parseInt(ipArr[0]));
            var portArr = HexString2Bytes(padLeft(parseInt(ipPort[1]).toString(16),'0',4));
            payload.push(portArr[1],portArr[0]);
            //灌溉过程中数据上报时间
            payload = payload.concat(HexString2Bytes(padLeft(parseInt(paras["reportInterval"]).toString(16),'0',4)));
            //流量定时上报时间
            payload = payload.concat(HexString2Bytes(padLeft(parseInt(paras["flowReportInterval"]).toString(16),'0',4)));
            //执行方式,1立即执行(无响应)，2重启后执行
            payload.push(parseInt(paras["execType"]));
        }else if(cmd_name == "C_DEVICE_CONTROL_CONFIG_READ"){//读取设备配置
            payload = payload.concat(HexString2Bytes("5085"));
            //终端编号
            var devCodeHex = padLeft(parseInt(paras["devCode"]).toString(16),'0',16);
            payload = payload.concat(HexString2Bytes(devCodeHex));
            //村号 6byte BCD
            var villageNumHex = padLeft(paras["villageNum"],'0',12);
            payload = payload.concat(HexString2Bytes(villageNumHex));
        }else if(cmd_name == "C_DEVICE_UPGRADE_SOFTVERSION_READ"){//读取软件版本号
            payload = payload.concat(HexString2Bytes("5060"));
            //终端编号
            var devCodeHex = padLeft(parseInt(paras["devCode"]).toString(16),'0',16);
            payload = payload.concat(HexString2Bytes(devCodeHex));
        }else if(cmd_name == "C_DEVICE_UPGRADE_SOFTVERSION_NEW"){//发送新版本
            payload = payload.concat(HexString2Bytes("5061"));
            //终端编号
            var devCodeHex = padLeft(parseInt(paras["devCode"]).toString(16),'0',16);
            payload = payload.concat(HexString2Bytes(devCodeHex));
            //新版本号
            var newVersion = paras["newVersion"];
            payload.push(newVersion.length);
            var newVersionArr = string2Bytes(newVersion);
            for(var i=newVersion.length;i<21;i++){
                newVersionArr.push(0);
            }
            payload = payload.concat(newVersionArr);
            //新程序文件大小
            var fileSize = padLeft(parseInt(paras["packageSize"]).toString(16),'0',8);
            payload = payload.concat(HexString2Bytes(fileSize));
        }else if(cmd_name == "C_DEVICE_UPGRADE_SOFTVERSION_SUBPACKAGE"){//以命令形式响应分包
            payload = payload.concat(HexString2Bytes("5062"));
            //终端编号
            var devCodeHex = padLeft(parseInt(paras["devCode"]).toString(16),'0',16);
            payload = payload.concat(HexString2Bytes(devCodeHex));
            //新版本号
            var newVersion = paras["newVersion"];
            payload.push(newVersion.length);
            var newVersionArr = string2Bytes(newVersion);
            for(var i=newVersion.length;i<21;i++){
                newVersionArr.push(0);
            }
            payload = payload.concat(newVersionArr);
            //分包序号
            var subpackageNum = padLeft(parseInt(paras["subpackageNum"]).toString(16),'0',4);
            payload = payload.concat(HexString2Bytes(subpackageNum));
            //分包数据长度
            var subpackageSize = padLeft(parseInt(paras["subpackageSize"]).toString(16),'0',4);
            payload = payload.concat(HexString2Bytes(subpackageSize));
            //分包数据
            var subpackageData = paras["subpackageData"];
            payload = payload.concat(HexString2Bytes(subpackageData));
        }else if(cmd_name == "C_DEVICE_UPGRADE_SOFTVERSION_STATE"){//以命令形式响应升级状态请求
            payload = payload.concat(HexString2Bytes("5063"));
            //终端编号
            var devCodeHex = padLeft(parseInt(paras["devCode"]).toString(16),'0',16);
            payload = payload.concat(HexString2Bytes(devCodeHex));
            //新版本号
            var newVersion = paras["newVersion"];
            payload.push(newVersion.length);
            var newVersionArr = string2Bytes(newVersion);
            for(var i=newVersion.length;i<21;i++){
                newVersionArr.push(0);
            }
            payload = payload.concat(newVersionArr);
            //新程序文件大小
            var fileSize = padLeft(parseInt(paras["packageSize"]).toString(16),'0',8);
            payload = payload.concat(HexString2Bytes(fileSize));
        }else if(cmd_name == "C_DEVICE_SETTINGS_READ_5092"){//平台读取配置
            payload = payload.concat(HexString2Bytes("5092"));
            //终端编号
            var devCodeHex = padLeft(parseInt(paras["devCode"]).toString(16),'0',16);
            payload = payload.concat(HexString2Bytes(devCodeHex));
        }else if(cmd_name == "C_DEVICE_SETTINGS_WRITE_5093"){//平台下发配置
            payload = payload.concat(HexString2Bytes("5093"));
            //终端编号
            var devCodeHex = padLeft(parseInt(paras["devCode"]).toString(16),'0',16);
            payload = payload.concat(HexString2Bytes(devCodeHex));
            //压力越限值
            var yali_lvHex = padLeft((parseInt(paras["yaliLv"])).toString(16),'0',8);
            payload = payload.concat(HexString2Bytes(yali_lvHex));
            //压力变幅值
            var yalibf_lvHex = padLeft((parseInt(paras["yalibfLv"])).toString(16),'0',8);
            payload = payload.concat(HexString2Bytes(yalibf_lvHex));
        }else if(cmd_name == "C_DEVICE_COMMAND_PACKAGE_502C"){
            payload = payload.concat(HexString2Bytes("502C"));
            //终端编号
            var devCodeHex = padLeft(parseInt(paras["devCode"]).toString(16),'0',16);
            payload = payload.concat(HexString2Bytes(devCodeHex));
            //透传数据
            var pdataHex = paras["pdataHex"];
            payload = payload.concat(HexString2Bytes(pdataHex));
        }
        //长度
        var len = payload.length;
        payload.unshift(parseInt("68",16));
        var lenBytes = HexString2Bytes(padLeft(len.toString(16),'0',4));
        payload.unshift(lenBytes[0],lenBytes[1]);
        payload.unshift(parseInt("68",16));
        //校验
        var cs = getCheckSum(payload,4, len);
        payload.push(cs,parseInt("16",16));
    }
    return payload;
}
