package com.carrie.demo.guangrao;

import com.carrie.demo.utils.BinaryConverter;
import jdk.nashorn.api.scripting.ScriptObjectMirror;

import javax.script.Invocable;
import javax.script.ScriptEngine;
import javax.script.ScriptEngineManager;

/**
 * @日期: 2021/5/21
 * @作者: dd
 * @描述:
 */
public class iot {

    public static void main(String[] args) {

        try {

            //  todo 初始化 JavaScript 引擎
            ScriptEngineManager manager = new ScriptEngineManager();
            ScriptEngine engine = manager.getEngineByName("javascript");

            //  获取js文件的绝对路径
            String scriptPath = iot.class.getClassLoader().getResource("static/js/gr.js").getPath();
            String baseConverter = "src/main/resources/static/lib/baseConverter.js";
            String csUtil = "src/main/resources/static/lib/csUtil.js";

            //  加载 js源文件
            engine.eval("load('" + scriptPath + "');");
            engine.eval("load('" + baseConverter + "');");
            engine.eval("load('" + csUtil + "');");

            /**
             * 这里我们将 engine 强制转换为 Invocable 类型，使用 invokeFunction 方法将参数传递给脚本引擎。
             * invokeFunction 这个方法使用了可变参数的定义方式，可以一次传递多个参数，并且将脚本语言的返回值作为它的返回值。
             */
            Invocable inv = (Invocable) engine;

            // 获取对象
            Object calculator = engine.get("calculator");

            //  iot 上的设备号，和16进制流
            String subdev_code = "640001994";
            String dataHex = "680014684101030107015008000000002625A7CAAC1B00204916";

            byte[] bytes = BinaryConverter.HexString2Bytes(dataHex);

            //  将 Java 对象转成 JavaScript 对象
            Object Java = engine.get("Java");
            ScriptObjectMirror bytes_som = (ScriptObjectMirror) inv.invokeMethod(Java, "from", bytes);

            //  进行 js 方法的调用，test为 js文件里的方法
            Object o = inv.invokeMethod(calculator, "decode",bytes_som,subdev_code);

            System.out.printf(o.toString());

        } catch(Exception e) {

            e.printStackTrace();

        }

    }


}
