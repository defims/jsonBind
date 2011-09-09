/*
 * jQuery JsonBind Library v1.1.1
 * 
 * http://blog.idea5.org/
 *
 * Copyright 2011, Defims Loong
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 *
 */ 
;(function($){$.fn.extend({
    "jsonBind":function(param,options,callback){   
        /*options参数省略情况*/
        $.isFunction(options) ? callback = options :"";
        /*参数初始化*/    
        options=jQuery.extend ({        
            templatePattern       : /data-template=["']([^"']+)["']/gim,               //模板标志的模式，默认为作用为整个dom
            innerTemplatePattern  : /data-template-in=["']([^"']+)["']/gim,            //内作用模板标志的模式，即作用为dom内的内容，不报扩dom本身,和templatePattern不可一起用
            attributePattern      : /data-attr-(\w+)=["']([^"']+)["']/gim,             //位于属性位置的模式,data-attr-XX="XX{XX}XX"
            attributeValuePattern : /{([^"'{}]+)}/gim,                                 //属性值的模式,"XX{XX}XX"      
            elementPattern        : /<!--(\w+)-->/gim,                                 //位于结点内的模式
            serialPattern         : /serial/im,                                        //唯一序列模式
            hideTemplate          : true ,
            hideDataPath          : true ,                
            debug                 : false
        },options);    
        /*debug*/
        options.debug ? console.log("---------data:-----------\n"+param+"\n--------options:---------\n"+(function(){
            var result="";
            for(var i in options){
                result+= i+"  :   "+options[i]+"\n";
            } 
            return result;
        })()) :"";
        /*全局变量初始化*/        
        var targetDom = $(this);        
        /*引入json数据，如果data值为url则引入json数据*/
        if(targetDom.length){//是否有模板的判断
            if(typeof(param)=="string"){
                var scriptDom=document.createElement("SCRIPT");  
                scriptDom.id = "jsonBindTempDom";      
                scriptDom.src = param;
	            scriptDom.type = 'text/javascript';
	            scriptDom.onload = scriptDom.onreadystatechange = function(){//onreadystatechange，仅IE	            
	                if (!this.readyState || this.readyState === "loaded" || this.readyState === "complete") {           
                        fnInit(targetDom,data);  //读入引入文件的data变量
		                scriptDom.onload = scriptDom.onreadystatechange = null//清内存，防止IE memory leaks
	                }
                }
                document.getElementsByTagName("HEAD")[0].appendChild(scriptDom); 
                /*$.ajax({
                    url:data,
                    success:function(data){
                        //console.log(eval(data));                        
                        fnInit(targetDom,eval(data));  //读入引入文件的data变量
                    }
                });*/
            }else{
                fnInit(targetDom,param);
            }
        }//可增加调试模式记录错误信息
        /*函数初始化*/
        function fnInit(targetDom,data){
            /*处理json初始层级*/
            var attr = targetDom.attr("data-template") ? targetDom.attr("data-template") : targetDom.attr("data-template-in");
            if( attr =="root"|| attr =="template"){
                var useData = data;       
                var dataPath = "";               
            }else{
                var useData = data[attr];
                var dataPath = attr;
            }
            /*callback处理,如果有callback则直接回递渲染的结果*/
            if(callback){
                callback.call(targetDom,fnRender(targetDom,useData,dataPath),data);
            }else{
                targetDom.after(fnRender(targetDom,useData,dataPath));
            }
            /*模板隐藏*/
            if(options.hideTemplate){
                targetDom.hide();
            }      
        }  
        /*渲染*/
        function fnRender(template,data,path){    
            /*创建容器Dom*/       
            var templateDom = $(template).clone().empty();  
            
            /*将单纯的对象转为长度为1的数组*/
            if(Object.prototype.toString.apply(data).split("object ")[1].split("]")[0]=="Object"){
                data=new Array(data);
            };       
            /*生成容器内内容*/  
            var serialNum = 0;   
            for(var index=0;index<data.length;++index){
                /*创建临时元素*/
                var renderTemp=$(template).clone();  
                /*渲染子元素*/    
                renderTemp.find("[data-template],[data-template-in]").replaceWith(function(){
                    var attr = $(this).attr("data-template")?$(this).attr("data-template"):$(this).attr("data-template-in");
                    var dataTemp = data[index][attr];   
                    if(dataTemp){//防止找不到数据报错
                        var content = fnRender($(this),dataTemp,path+"["+index+"]."+attr);
                    }
                    return content?content:"";
                });
                /*重复并替换模板*/           
                if(template.attr("data-template-in")){//处理innerTemplate如: data-template-in
                    templateDom.append($(fnTemplateReplace()).html());  
                }else{
                    templateDom.append(fnTemplateReplace());  
                }                
                
                function fnTemplateReplace(){                 
                    options.debug ? console.log("--------Template:--------\n"+renderTemp.wrap("<div/\>").parent().html()+"\n\n-------Rendering...-----\n") : "";    
                    return renderTemp.wrap("<div/\>").parent().html()
                      .replace(options.elementPattern,function(o,i){//处理结点模式如： <!--XX-->
                        if(options.serialPattern.test(i)){
                            return serialNum++;
                        }else{
                            return data[index][i] ? data[index][i] : "";
                        }
                    }).replace(options.templatePattern,function(m,value){//处理模板标志如：data-template                                                      
                        return options.hideDataPath ? "" : "data-path='"+(path+"["+index+"]")+"'";
                    }).replace(options.attributePattern,function(m,attr,value){//处理属性替换模式如：data-attr-XX     
                        value = value.replace(options.attributeValuePattern,function(){//遍历替换所有attr中的值如果{id}{random}
                            //console.log(options.attributeValuePattern);
                            for(var i=1; i<arguments.length-2;++i){
                                if(options.serialPattern.test(arguments[i])){                                
                                    return serialNum++;
                                }else{                                                       
                                    return data[index][arguments[i]] ? data[index][arguments[i]] : "";
                                }                            
                            }   
                        }) 
                        options.debug ? ( console.log(m+" --> " + (value ? attr+"=\'"+value+"\'" : "")) ):"";//debug输出                                           
                        return value ? attr+"=\'"+value+"\'" : "";                         
                    });
                }              
            }
            /*删除创建的节点*/
            $("#jsonBindTempDom").remove();
            /*删除数据*/
            data = null;
            /*返回生成内容*/
            options.debug ? console.log("--------result:---------\n"+(template.attr("data-template") ? templateDom.html() : templateDom.wrap("<div/\>").parent().html())+"\n\n\n"):"";
            return template.attr("data-template") ? templateDom.html() : templateDom.wrap("<div/\>").parent().html();  
        }      
    }
})})(jQuery)