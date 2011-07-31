/*
 * jQuery JsonBind Library v1.0.6
 * 
 * http://blog.idea5.org/
 *
 * Copyright 2011, Defims Loong
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 *
 * Date: Sat Jul 30 10:13:56 2011
 *
 */ 
;(function($){$.fn.extend({
    "jsonBind":function(options,callback){                
        /*参数初始化*/
        options=jQuery.extend ({   
            data:  "",         
            templatePattern       : /data-template=["']([^"']+)["']/gim,               //模板标志的模式
            attributePattern      : /data-attr-(\w+)=["']([^"']+)["']/gim,             //位于属性位置的模式,data-attr-XX="XX{XX}XX"
            attributeValuePattern : /{([^"'{}]+)}/gim,                                 //属性值的模式,"XX{XX}XX"      
            elementPattern        : /<!--(\w+)-->/gim,                                 //位于结点内的模式
            serialPattern         : /serial/im,                                        //唯一序列模式
            hideTemplate          : true ,
            hideDataPath          : true
        },options);  
        var serialNum = 0;
        /*处理json初始层级*/
        if($(this).data("template")=="root"||$(this).data("template")=="template"){
            var useData = options.data;       
            var dataPath = "";               
        }else{
            var useData = options.data[$(this).data("template")];
            var dataPath = $(this).data("template");
        }
        /*callback处理,如果有callback则直接回递渲染的结果*/
        if(callback){
            callback(render($(this),useData,dataPath));
        }else{
            $(this).after(render($(this),useData,dataPath));
        }
        /*模板隐藏*/
        if(options.hideTemplate){
            $(this).hide();
        }        
        /*渲染*/
        function render(template,data,path){           
            var templateDom=$("<div/\>");          
            if(Object.prototype.toString.apply(data).split("object ")[1].split("]")[0]=="Object"){//将单纯的对象转为长度为1的数组
                data=new Array(data);
            };            
            for(var index=0;index<data.length;++index){  
                /*创建临时元素*/
                var renderTemp=$(template).clone();  
                /*渲染子元素*/
                renderTemp.find(":[data-template]").replaceWith(function(){
                    var dataTemp = data[index][$(this).data("template")];  
                    var dataPath = path+"["+index+"]."+$(this).data("template");   
                    if(dataTemp){//防止找不到数据报错
                        var content =render($(this),dataTemp,dataPath);
                    }
                    return content?content:"";
                });
                /*重复并替换模板*/ 
                templateDom.append(renderTemp.wrap("<div/\>").parent().html().replace(options.elementPattern,function(o,i){//处理结点模式如： <!--XX-->
                    if(options.serialPattern.test(i)){
                        return serialNum++;
                    }else{
                        return data[index][i] ? data[index][i] : "";
                    }
                }).replace(options.templatePattern,function(m,value){//处理模板标志如：data-template                                                      
                    return options.hideDataPath ? "" : "data-path='"+(path+"["+index+"]")+"'";
                }).replace(options.attributePattern,function(m,attr,value){//处理属性替换模式如：data-attr-XX     
                    value = value.replace(options.attributeValuePattern,function(){//遍历替换所有attr中的值如果{id}{random}
                        for(var i=1; i<arguments.length-2;++i){
                            if(options.serialPattern.test(arguments[i])){                                
                                return serialNum++;
                            }else{                    
                                return data[index][arguments[i]] ? data[index][arguments[i]] : "";
                            }                            
                        }
                    })                                          
                    return value ? attr+"=\'"+value+"\'" : "";                         
                }));                
            }
            return templateDom.html();
        }        
    }
})})(jQuery)
