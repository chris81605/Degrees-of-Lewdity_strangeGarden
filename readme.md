# Degrees-of-Lewdity
- <img decoding="async" src="https://gitgud.io/uploads/-/system/user/avatar/9096/avatar.png" width="24" alt=""> <b>遊戲作者</b> $\color{purple} {Vrelnir}$
  - [Vrelnir 的blog][blog]
  - [英文遊戲維基][wiki-en]
  - [中文英文遊戲維基][wiki-cn]
  - [官方 Discord][discord]
  - [遊戲源碼倉庫][gitgud]

# 需求  
* 需要搭配[MODLOADER][JML]使用  
* 需搭配[Degrees of Lewdity 中文本地化][DOLCN]使用  
* 需搭配[Simple Framework][SF]使用  


# 萬物皆可種農場  
**功能：**  
* **為Degrees-of-Lewdity新增要素：**  
  * 在工業區增加一個可以生產任何商品的生產基地。
  
# 更新日誌 
**0.12.0**  
* 變更種子添加邏輯  
        * 現在必須持有至少一個物品時進入農場才能解鎖該可種植物品  

**0.11.1**  
* 修正在Debug模式下點選設備生產後爆紅的問題  

**0.11.0**  
* 優化農場初始化方式，確保後續更新新增設備能正常顯示  
* 修正部分排版錯誤  
* 修正購買農場時爆紅問題  
* 新增-能在統計選項顯示購買農場的開銷紀錄  

**0.10.0**  
* 新增可生產料理的設備 （需求遊戲本體0.5.3.7+）  
* 新增可生產河裡的魚的設備 （需求遊戲本體0.5.3.7+）  
* 新增可生產海裡的魚的設備 （需求遊戲本體0.5.3.7+）  
* 調整可種植項目的顯示方式，當前設備不可種植的項目默認摺疊不顯示  

**0.9.1**  
* 修復嚴重錯誤：點選生產後爆紅  
* 修復無法開闢雞蛋種植  
* 修復重新整理後雞蛋及貝殼田消失問題  

**0.9**  
* 使用`simpleframwork`實現新增地點功能，0.9版起需要[Simple Framework][SF]為前置需求  

**0.8.4**  
* 新增可種植珍珠的設備 （需求遊戲本體0.4.6.7+） 
* 新增可生產雞蛋的設備 （需求遊戲本體0.4.6.7+） 


**0.8.3**  
* 修復北極星擴展環境下遊戲初始化彈窗問題  

**0.8.2**  
* 修複離開牧場後將所有種子列表清空的問題  
    * 現在只會清空非花卉及蔬菜水果類的特殊種子  
    
**0.8.1**  
* 修復非植物產品無法種植(母乳、蜂巢、菇類等)的問題  
* 優化  
    * 在其他可種植的區域不再顯示非植物類種子，現在你必須持有最少一個產品才能在牧場內種植該產品  

**0.8.0**  
* 優化代碼，將初始化相關代碼獨立至
**Widgets strangeGarden_init**，採**widget**方式調用相關代碼初始化農場  
 
**0.7.1**  
* 修正文字描述問題  
* 添加工坊專用肥料(目前僅可透過修改$SG_fertiliser.current變數獲取)  
* 修正設備編號顯示問題  

**0.6.0**  
* 修正文字描述問題  

**0.5.0**  
* 功能完善  

# TODO  
* 添加工坊專用肥料(目前僅可透過修改$SG_fertiliser.current變數獲取)  
* 添加合適的ICON(缺素材)  
* 添加可能的戰鬥(榨精?)  
* √完善操作增加與減少的屬性(參考原版種植系統(工坊專用))  
* 完善設備擴充所需條件   
* 修正各處文字描述(調整中)  
* √修正設備大於10後編號顯示問題。  
* √功能測試(功能已可正常運作)  

[blog]: https://vrelnir.blogspot.com/
[wiki-en]: https://degreesoflewdity.miraheze.org/wiki
[wiki-cn]: https://degreesoflewditycn.miraheze.org/wiki
[gitgud]: https://gitgud.io/Vrelnir/degrees-of-lewdity/-/tree/master/
[discord]: https://discord.gg/VznUtEh
[JML]:https://github.com/Lyoko-Jeremie/sugarcube-2-ModLoader  
[DOLCN]:https://github.com/Eltirosto/Degrees-of-Lewdity-Chinese-Localization  
[SF]:https://github.com/emicoto/DOLMods