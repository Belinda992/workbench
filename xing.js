// ===== 映思学堂 · 经营工作台 =====
// 复用 life.js 中已定义的全局：$ / $$ / store / toast / escapeHtml / todayStr
// 本地自带下载函数，避免依赖命名差异

const XS = {
  students: "wb_xs_students",
  leads: "wb_xs_leads",
  cards: "wb_xs_cards",
  reports: "wb_xs_reports",
  expenses: "wb_xs_expenses",
  courses: "wb_xs_courses",
  materials: "wb_xs_materials",
  productions: "wb_xs_productions",
  schedules: "wb_xs_schedules",
  metrics: "wb_xs_metrics",
};

const ABILITIES = ["直映力", "观察力", "专注力", "想象力", "联结力", "分类思维力", "阅读理解力", "信息提取力", "规律推理力", "规则迁移力"];

// 部编版必背古诗文种子数据：每条 [诗名, 朝代, 作者, 年级, 学期, 类型, 必背阶段]
// 类型：五言绝句/七言绝句/五言律诗/七言律诗/古诗/小令/中调/长调/短古文/中古文/长古文
const SEED_CARDS = [
  // —— 小学 一年级上 ——
  ["咏鹅", "唐", "骆宾王", "一年级", "上", "古诗", ["小学必背"]],
  ["江南", "汉", "汉乐府", "一年级", "上", "古诗", ["小学必背"]],
  ["画", "唐", "王维", "一年级", "上", "五言绝句", ["小学必背"]],
  ["悯农(其二)", "唐", "李绅", "一年级", "上", "古诗", ["小学必背"]],
  ["古朗月行(节选)", "唐", "李白", "一年级", "上", "古诗", ["小学必背"]],
  ["风", "唐", "李峤", "一年级", "上", "五言绝句", ["小学必背"]],
  // —— 一年级下 ——
  ["春晓", "唐", "孟浩然", "一年级", "下", "五言绝句", ["小学必背"]],
  ["赠汪伦", "唐", "李白", "一年级", "下", "七言绝句", ["小学必背"]],
  ["静夜思", "唐", "李白", "一年级", "下", "五言绝句", ["小学必背"]],
  ["寻隐者不遇", "唐", "贾岛", "一年级", "下", "五言绝句", ["小学必背"]],
  ["池上", "唐", "白居易", "一年级", "下", "五言绝句", ["小学必背"]],
  ["小池", "宋", "杨万里", "一年级", "下", "七言绝句", ["小学必背"]],
  ["画鸡", "明", "唐寅", "一年级", "下", "七言绝句", ["小学必背"]],
  // —— 二年级上 ——
  ["梅花", "宋", "王安石", "二年级", "上", "五言绝句", ["小学必背"]],
  ["小儿垂钓", "唐", "胡令能", "二年级", "上", "七言绝句", ["小学必背"]],
  ["登鹳雀楼", "唐", "王之涣", "二年级", "上", "五言绝句", ["小学必背"]],
  ["望庐山瀑布", "唐", "李白", "二年级", "上", "七言绝句", ["小学必背"]],
  ["江雪", "唐", "柳宗元", "二年级", "上", "五言绝句", ["小学必背"]],
  ["夜宿山寺", "唐", "李白", "二年级", "上", "五言绝句", ["小学必背"]],
  ["敕勒歌", "北朝", "北朝民歌", "二年级", "上", "古诗", ["小学必背"]],
  // —— 二年级下 ——
  ["村居", "清", "高鼎", "二年级", "下", "七言绝句", ["小学必背"]],
  ["咏柳", "唐", "贺知章", "二年级", "下", "七言绝句", ["小学必背"]],
  ["赋得古原草送别", "唐", "白居易", "二年级", "下", "五言律诗", ["小学必背"]],
  ["晓出净慈寺送林子方", "宋", "杨万里", "二年级", "下", "七言绝句", ["小学必背"]],
  ["绝句(两个黄鹂)", "唐", "杜甫", "二年级", "下", "七言绝句", ["小学必背"]],
  ["悯农(其一)", "唐", "李绅", "二年级", "下", "古诗", ["小学必背"]],
  ["舟夜书所见", "清", "查慎行", "二年级", "下", "五言绝句", ["小学必背"]],
  // —— 三年级上 ——
  ["司马光", "宋", "司马光", "三年级", "上", "短古文", ["小学必背"]],
  ["所见", "清", "袁枚", "三年级", "上", "五言绝句", ["小学必背"]],
  ["早发白帝城", "唐", "李白", "三年级", "上", "七言绝句", ["小学必背"]],
  ["采莲曲", "唐", "王昌龄", "三年级", "上", "七言绝句", ["小学必背"]],
  ["绝句(迟日江山丽)", "唐", "杜甫", "三年级", "上", "五言绝句", ["小学必背"]],
  ["惠崇春江晚景", "宋", "苏轼", "三年级", "上", "七言绝句", ["小学必背"]],
  ["三衢道中", "宋", "曾几", "三年级", "上", "七言绝句", ["小学必背"]],
  ["忆江南", "唐", "白居易", "三年级", "上", "小令", ["小学必背"]],
  ["元日", "宋", "王安石", "三年级", "上", "七言绝句", ["小学必背"]],
  ["清明", "唐", "杜牧", "三年级", "上", "七言绝句", ["小学必背"]],
  ["九月九日忆山东兄弟", "唐", "王维", "三年级", "上", "七言绝句", ["小学必背"]],
  // —— 三年级下 ——
  ["滁州西涧", "唐", "韦应物", "三年级", "下", "七言绝句", ["小学必背"]],
  ["大林寺桃花", "唐", "白居易", "三年级", "下", "七言绝句", ["小学必背"]],
  ["守株待兔", "先秦", "韩非", "三年级", "下", "短古文", ["小学必背"]],
  // —— 四年级上 ——
  ["鹿柴", "唐", "王维", "四年级", "上", "五言绝句", ["小学必背"]],
  ["暮江吟", "唐", "白居易", "四年级", "上", "七言绝句", ["小学必背"]],
  ["题西林壁", "宋", "苏轼", "四年级", "上", "七言绝句", ["小学必背"]],
  ["雪梅", "宋", "卢梅坡", "四年级", "上", "七言绝句", ["小学必背"]],
  ["出塞", "唐", "王昌龄", "四年级", "上", "七言绝句", ["小学必背"]],
  ["凉州词(葡萄美酒)", "唐", "王翰", "四年级", "上", "七言绝句", ["小学必背"]],
  ["夏日绝句", "宋", "李清照", "四年级", "上", "五言绝句", ["小学必背"]],
  ["别董大", "唐", "高适", "四年级", "上", "七言绝句", ["小学必背"]],
  ["精卫填海", "先秦", "山海经", "四年级", "上", "短古文", ["小学必背"]],
  ["王戎不取道旁李", "南朝", "刘义庆", "四年级", "上", "短古文", ["小学必背"]],
  // —— 四年级下 ——
  ["四时田园杂兴(其二十五)", "宋", "范成大", "四年级", "下", "七言绝句", ["小学必背"]],
  ["宿新市徐公店", "宋", "杨万里", "四年级", "下", "七言绝句", ["小学必背"]],
  ["清平乐·村居", "宋", "辛弃疾", "四年级", "下", "中调", ["小学必背"]],
  ["卜算子·咏梅", "现代", "毛泽东", "四年级", "下", "小令", ["小学必背"]],
  ["蜂", "唐", "罗隐", "四年级", "下", "七言绝句", ["小学必背"]],
  ["独坐敬亭山", "唐", "李白", "四年级", "下", "五言绝句", ["小学必背"]],
  ["芙蓉楼送辛渐", "唐", "王昌龄", "四年级", "下", "七言绝句", ["小学必背"]],
  ["塞下曲(月黑雁飞高)", "唐", "卢纶", "四年级", "下", "五言绝句", ["小学必背"]],
  ["墨梅", "元", "王冕", "四年级", "下", "七言绝句", ["小学必背"]],
  ["囊萤夜读", "唐", "房玄龄", "四年级", "下", "短古文", ["小学必背"]],
  ["铁杵成针", "宋", "祝穆", "四年级", "下", "短古文", ["小学必背"]],
  // —— 五年级上 ——
  ["示儿", "宋", "陆游", "五年级", "上", "七言绝句", ["小学必背"]],
  ["题临安邸", "宋", "林升", "五年级", "上", "七言绝句", ["小学必背"]],
  ["己亥杂诗(其二百二十)", "清", "龚自珍", "五年级", "上", "七言绝句", ["小学必背"]],
  ["山居秋暝", "唐", "王维", "五年级", "上", "五言律诗", ["小学必背"]],
  ["枫桥夜泊", "唐", "张继", "五年级", "上", "七言绝句", ["小学必背"]],
  ["长相思(山一程)", "清", "纳兰性德", "五年级", "上", "小令", ["小学必背"]],
  ["渔歌子", "唐", "张志和", "五年级", "上", "小令", ["小学必背"]],
  ["观书有感(其一)", "宋", "朱熹", "五年级", "上", "七言绝句", ["小学必背"]],
  ["观书有感(其二)", "宋", "朱熹", "五年级", "上", "七言绝句", ["小学必背"]],
  ["少年中国说(节选)", "清", "梁启超", "五年级", "上", "中古文", ["小学必背"]],
  ["古人谈读书", "先秦", "论语等", "五年级", "上", "短古文", ["小学必背"]],
  // —— 五年级下 ——
  ["四时田园杂兴(其三十一)", "宋", "范成大", "五年级", "下", "七言绝句", ["小学必背"]],
  ["稚子弄冰", "宋", "杨万里", "五年级", "下", "七言绝句", ["小学必背"]],
  ["村晚", "宋", "雷震", "五年级", "下", "七言绝句", ["小学必背"]],
  ["游子吟", "唐", "孟郊", "五年级", "下", "古诗", ["小学必背"]],
  ["鸟鸣涧", "唐", "王维", "五年级", "下", "五言绝句", ["小学必背"]],
  ["凉州词(黄河远上)", "唐", "王之涣", "五年级", "下", "七言绝句", ["小学必背"]],
  ["送元二使安西", "唐", "王维", "五年级", "下", "七言绝句", ["小学必背"]],
  ["秋夜将晓出篱门迎凉有感", "宋", "陆游", "五年级", "下", "七言绝句", ["小学必背"]],
  ["黄鹤楼送孟浩然之广陵", "唐", "李白", "五年级", "下", "七言绝句", ["小学必背"]],
  ["寒菊", "宋", "郑思肖", "五年级", "下", "七言绝句", ["小学必背"]],
  ["杨氏之子", "南朝", "刘义庆", "五年级", "下", "短古文", ["小学必背"]],
  ["自相矛盾", "先秦", "韩非", "五年级", "下", "短古文", ["小学必背"]],
  // —— 六年级上 ——
  ["宿建德江", "唐", "孟浩然", "六年级", "上", "五言绝句", ["小学必背"]],
  ["六月二十七日望湖楼醉书", "宋", "苏轼", "六年级", "上", "七言绝句", ["小学必背"]],
  ["西江月·夜行黄沙道中", "宋", "辛弃疾", "六年级", "上", "小令", ["小学必背"]],
  ["过故人庄", "唐", "孟浩然", "六年级", "上", "五言律诗", ["小学必背"]],
  ["春日", "宋", "朱熹", "六年级", "上", "七言绝句", ["小学必背"]],
  ["回乡偶书", "唐", "贺知章", "六年级", "上", "七言绝句", ["小学必背"]],
  ["浪淘沙(其一)", "唐", "刘禹锡", "六年级", "上", "七言绝句", ["小学必背"]],
  ["江南春", "唐", "杜牧", "六年级", "上", "七言绝句", ["小学必背"]],
  ["书湖阴先生壁", "宋", "王安石", "六年级", "上", "七言绝句", ["小学必背"]],
  ["伯牙鼓琴", "先秦", "吕氏春秋", "六年级", "上", "短古文", ["小学必背"]],
  ["书戴嵩画牛", "宋", "苏轼", "六年级", "上", "短古文", ["小学必背"]],
  // —— 六年级下 ——
  ["寒食", "唐", "韩翃", "六年级", "下", "七言绝句", ["小学必背"]],
  ["迢迢牵牛星", "汉", "古诗十九首", "六年级", "下", "古诗", ["小学必背"]],
  ["十五夜望月", "唐", "王建", "六年级", "下", "七言绝句", ["小学必背"]],
  ["长歌行", "汉", "汉乐府", "六年级", "下", "古诗", ["小学必背"]],
  ["马诗(其五)", "唐", "李贺", "六年级", "下", "五言绝句", ["小学必背"]],
  ["石灰吟", "明", "于谦", "六年级", "下", "七言绝句", ["小学必背"]],
  ["竹石", "清", "郑燮", "六年级", "下", "七言绝句", ["小学必背"]],
  ["采薇(节选)", "先秦", "诗经", "六年级", "下", "古诗", ["小学必背"]],
  ["春夜喜雨", "唐", "杜甫", "六年级", "下", "五言律诗", ["小学必背"]],
  ["江畔独步寻花(其六)", "唐", "杜甫", "六年级", "下", "七言绝句", ["小学必背"]],
  ["早春呈水部张十八员外", "唐", "韩愈", "六年级", "下", "七言绝句", ["小学必背"]],
  ["泊船瓜洲", "宋", "王安石", "六年级", "下", "七言绝句", ["小学必背"]],
  ["游园不值", "宋", "叶绍翁", "六年级", "下", "七言绝句", ["小学必背"]],
  ["卜算子·送鲍浩然之浙东", "宋", "王观", "六年级", "下", "小令", ["小学必背"]],
  ["浣溪沙(游蕲水清泉寺)", "宋", "苏轼", "六年级", "下", "小令", ["小学必背"]],
  ["清平乐(春归何处)", "宋", "黄庭坚", "六年级", "下", "中调", ["小学必背"]],
  ["学弈", "先秦", "孟子", "六年级", "下", "短古文", ["小学必背"]],
  ["两小儿辩日", "先秦", "列子", "六年级", "下", "短古文", ["小学必背"]],
  // —— 初中 七年级上 ——
  ["观沧海", "汉", "曹操", "初一", "上", "古诗", ["初中必背"]],
  ["闻王昌龄左迁龙标遥有此寄", "唐", "李白", "初一", "上", "七言绝句", ["初中必背"]],
  ["次北固山下", "唐", "王湾", "初一", "上", "五言律诗", ["初中必背"]],
  ["天净沙·秋思", "元", "马致远", "初一", "上", "小令", ["初中必背"]],
  ["峨眉山月歌", "唐", "李白", "初一", "上", "七言绝句", ["初中必背"]],
  ["江南逢李龟年", "唐", "杜甫", "初一", "上", "七言绝句", ["初中必背"]],
  ["行军九日思长安故园", "唐", "岑参", "初一", "上", "七言绝句", ["初中必背"]],
  ["夜上受降城闻笛", "唐", "李益", "初一", "上", "七言绝句", ["初中必背"]],
  ["秋词(其一)", "唐", "刘禹锡", "初一", "上", "七言绝句", ["初中必背"]],
  ["夜雨寄北", "唐", "李商隐", "初一", "上", "七言绝句", ["初中必背"]],
  ["十一月四日风雨大作", "宋", "陆游", "初一", "上", "七言绝句", ["初中必背"]],
  ["潼关", "清", "谭嗣同", "初一", "上", "七言绝句", ["初中必背"]],
  ["论语十二章", "先秦", "孔子及弟子", "初一", "上", "短古文", ["初中必背"]],
  ["诫子书", "三国", "诸葛亮", "初一", "上", "短古文", ["初中必背"]],
  ["狼", "清", "蒲松龄", "初一", "上", "中古文", ["初中必背"]],
  ["穿井得一人", "先秦", "吕氏春秋", "初一", "上", "短古文", ["初中必背"]],
  ["杞人忧天", "先秦", "列子", "初一", "上", "短古文", ["初中必背"]],
  // —— 七年级下 ——
  ["木兰诗", "北朝", "北朝民歌", "初一", "下", "古诗", ["初中必背"]],
  ["竹里馆", "唐", "王维", "初一", "下", "五言绝句", ["初中必背"]],
  ["春夜洛城闻笛", "唐", "李白", "初一", "下", "七言绝句", ["初中必背"]],
  ["逢入京使", "唐", "岑参", "初一", "下", "七言绝句", ["初中必背"]],
  ["晚春", "唐", "韩愈", "初一", "下", "七言绝句", ["初中必背"]],
  ["登幽州台歌", "唐", "陈子昂", "初一", "下", "古诗", ["初中必背"]],
  ["望岳", "唐", "杜甫", "初一", "下", "五言律诗", ["初中必背"]],
  ["登飞来峰", "宋", "王安石", "初一", "下", "七言绝句", ["初中必背"]],
  ["游山西村", "宋", "陆游", "初一", "下", "七言律诗", ["初中必背"]],
  ["己亥杂诗(其五)", "清", "龚自珍", "初一", "下", "七言绝句", ["初中必背"]],
  ["泊秦淮", "唐", "杜牧", "初一", "下", "七言绝句", ["初中必背"]],
  ["贾生", "唐", "李商隐", "初一", "下", "七言绝句", ["初中必背"]],
  ["过松源晨炊漆公店", "宋", "杨万里", "初一", "下", "七言绝句", ["初中必背"]],
  ["约客", "宋", "赵师秀", "初一", "下", "七言绝句", ["初中必背"]],
  ["陋室铭", "唐", "刘禹锡", "初一", "下", "短古文", ["初中必背"]],
  ["爱莲说", "宋", "周敦颐", "初一", "下", "中古文", ["初中必背"]],
  ["孙权劝学", "宋", "司马光", "初一", "下", "短古文", ["初中必背"]],
  ["卖油翁", "宋", "欧阳修", "初一", "下", "中古文", ["初中必背"]],
  // —— 八年级上 ——
  ["野望", "唐", "王绩", "初二", "上", "五言律诗", ["初中必背"]],
  ["黄鹤楼", "唐", "崔颢", "初二", "上", "七言律诗", ["初中必背"]],
  ["使至塞上", "唐", "王维", "初二", "上", "五言律诗", ["初中必背"]],
  ["渡荆门送别", "唐", "李白", "初二", "上", "五言律诗", ["初中必背"]],
  ["钱塘湖春行", "唐", "白居易", "初二", "上", "七言律诗", ["初中必背"]],
  ["庭中有奇树", "汉", "古诗十九首", "初二", "上", "古诗", ["初中必背"]],
  ["龟虽寿", "汉", "曹操", "初二", "上", "古诗", ["初中必背"]],
  ["赠从弟(其二)", "汉", "刘桢", "初二", "上", "古诗", ["初中必背"]],
  ["梁甫行", "三国", "曹植", "初二", "上", "古诗", ["初中必背"]],
  ["饮酒(其五)", "晋", "陶渊明", "初二", "上", "古诗", ["初中必背"]],
  ["春望", "唐", "杜甫", "初二", "上", "五言律诗", ["初中必背"]],
  ["雁门太守行", "唐", "李贺", "初二", "上", "古诗", ["初中必背"]],
  ["赤壁", "唐", "杜牧", "初二", "上", "七言绝句", ["初中必背"]],
  ["渔家傲(天接云涛)", "宋", "李清照", "初二", "上", "中调", ["初中必背"]],
  ["浣溪沙(一曲新词)", "宋", "晏殊", "初二", "上", "小令", ["初中必背"]],
  ["采桑子(轻舟短棹)", "宋", "欧阳修", "初二", "上", "小令", ["初中必背"]],
  ["相见欢(金陵城上)", "宋", "朱敦儒", "初二", "上", "小令", ["初中必背"]],
  ["如梦令(常记溪亭)", "宋", "李清照", "初二", "上", "小令", ["初中必背"]],
  ["三峡", "北魏", "郦道元", "初二", "上", "中古文", ["初中必背"]],
  ["答谢中书书", "南朝", "陶弘景", "初二", "上", "短古文", ["初中必背"]],
  ["记承天寺夜游", "宋", "苏轼", "初二", "上", "短古文", ["初中必背"]],
  ["与朱元思书", "南朝", "吴均", "初二", "上", "中古文", ["初中必背"]],
  ["得道多助失道寡助", "先秦", "孟子", "初二", "上", "中古文", ["初中必背"]],
  ["富贵不能淫", "先秦", "孟子", "初二", "上", "短古文", ["初中必背"]],
  ["生于忧患死于安乐", "先秦", "孟子", "初二", "上", "中古文", ["初中必背"]],
  // —— 八年级下 ——
  ["关雎", "先秦", "诗经", "初二", "下", "古诗", ["初中必背"]],
  ["蒹葭", "先秦", "诗经", "初二", "下", "古诗", ["初中必背"]],
  ["式微", "先秦", "诗经", "初二", "下", "古诗", ["初中必背"]],
  ["子衿", "先秦", "诗经", "初二", "下", "古诗", ["初中必背"]],
  ["送杜少府之任蜀州", "唐", "王勃", "初二", "下", "五言律诗", ["初中必背"]],
  ["望洞庭湖赠张丞相", "唐", "孟浩然", "初二", "下", "五言律诗", ["初中必背"]],
  ["茅屋为秋风所破歌", "唐", "杜甫", "初二", "下", "古诗", ["初中必背"]],
  ["卖炭翁", "唐", "白居易", "初二", "下", "古诗", ["初中必背"]],
  ["题破山寺后禅院", "唐", "常建", "初二", "下", "五言律诗", ["初中必背"]],
  ["送友人", "唐", "李白", "初二", "下", "五言律诗", ["初中必背"]],
  ["卜算子·黄州定慧院寓居作", "宋", "苏轼", "初二", "下", "小令", ["初中必背"]],
  ["卜算子·咏梅", "宋", "陆游", "初二", "下", "小令", ["初中必背"]],
  ["桃花源记", "晋", "陶渊明", "初二", "下", "中古文", ["初中必背"]],
  ["小石潭记", "唐", "柳宗元", "初二", "下", "中古文", ["初中必背"]],
  ["核舟记", "明", "魏学洢", "初二", "下", "中古文", ["初中必背"]],
  ["北冥有鱼", "先秦", "庄子", "初二", "下", "中古文", ["初中必背"]],
  ["庄子与惠子游于濠梁", "先秦", "庄子", "初二", "下", "短古文", ["初中必背"]],
  ["虽有嘉肴", "先秦", "礼记", "初二", "下", "短古文", ["初中必背"]],
  ["大道之行也", "先秦", "礼记", "初二", "下", "中古文", ["初中必背"]],
  ["马说", "唐", "韩愈", "初二", "下", "中古文", ["初中必背"]],
  // —— 九年级上 ——
  ["沁园春·雪", "现代", "毛泽东", "初三", "上", "长调", ["初中必背"]],
  ["行路难(其一)", "唐", "李白", "初三", "上", "古诗", ["初中必背"]],
  ["酬乐天扬州初逢席上见赠", "唐", "刘禹锡", "初三", "上", "七言律诗", ["初中必背"]],
  ["水调歌头(明月几时有)", "宋", "苏轼", "初三", "上", "长调", ["初中必背"]],
  ["月夜忆舍弟", "唐", "杜甫", "初三", "上", "五言律诗", ["初中必背"]],
  ["长沙过贾谊宅", "唐", "刘长卿", "初三", "上", "七言律诗", ["初中必背"]],
  ["左迁至蓝关示侄孙湘", "唐", "韩愈", "初三", "上", "七言律诗", ["初中必背"]],
  ["商山早行", "唐", "温庭筠", "初三", "上", "五言律诗", ["初中必背"]],
  ["咸阳城东楼", "唐", "许浑", "初三", "上", "七言律诗", ["初中必背"]],
  ["无题(相见时难)", "唐", "李商隐", "初三", "上", "七言律诗", ["初中必背"]],
  ["行香子(树绕村庄)", "宋", "秦观", "初三", "上", "中调", ["初中必背"]],
  ["丑奴儿·书博山道中壁", "宋", "辛弃疾", "初三", "上", "小令", ["初中必背"]],
  ["岳阳楼记", "宋", "范仲淹", "初三", "上", "长古文", ["初中必背"]],
  ["醉翁亭记", "宋", "欧阳修", "初三", "上", "长古文", ["初中必背"]],
  ["湖心亭看雪", "明", "张岱", "初三", "上", "短古文", ["初中必背"]],
  ["鱼我所欲也", "先秦", "孟子", "初三", "上", "中古文", ["初中必背"]],
  // —— 九年级下 ——
  ["渔家傲·秋思", "宋", "范仲淹", "初三", "下", "中调", ["初中必背"]],
  ["江城子·密州出猎", "宋", "苏轼", "初三", "下", "中调", ["初中必背"]],
  ["破阵子·为陈同甫赋壮词", "宋", "辛弃疾", "初三", "下", "中调", ["初中必背"]],
  ["满江红(小住京华)", "清", "秋瑾", "初三", "下", "长调", ["初中必背"]],
  ["定风波(莫听穿林打叶声)", "宋", "苏轼", "初三", "下", "中调", ["初中必背"]],
  ["临江仙·夜登小阁忆洛中旧游", "宋", "陈与义", "初三", "下", "中调", ["初中必背"]],
  ["太常引·建康中秋夜为吕叔潜赋", "宋", "辛弃疾", "初三", "下", "小令", ["初中必背"]],
  ["浣溪沙(身向云山)", "清", "纳兰性德", "初三", "下", "小令", ["初中必背"]],
  ["十五从军征", "汉", "汉乐府", "初三", "下", "古诗", ["初中必背"]],
  ["白雪歌送武判官归京", "唐", "岑参", "初三", "下", "古诗", ["初中必背"]],
  ["南乡子·登京口北固亭有怀", "宋", "辛弃疾", "初三", "下", "中调", ["初中必背"]],
  ["过零丁洋", "宋", "文天祥", "初三", "下", "七言律诗", ["初中必背"]],
  ["山坡羊·潼关怀古", "元", "张养浩", "初三", "下", "小令", ["初中必背"]],
  ["南安军", "宋", "文天祥", "初三", "下", "五言律诗", ["初中必背"]],
  ["别云间", "明", "夏完淳", "初三", "下", "五言律诗", ["初中必背"]],
  ["出师表", "三国", "诸葛亮", "初三", "下", "长古文", ["初中必背"]],
  ["曹刿论战", "先秦", "左传", "初三", "下", "中古文", ["初中必背"]],
  ["邹忌讽齐王纳谏", "先秦", "战国策", "初三", "下", "中古文", ["初中必背"]],
  ["送东阳马生序", "明", "宋濂", "初三", "下", "长古文", ["初中必背"]],
  // —— 高中（部编版必修必背，节选）——
  ["沁园春·长沙", "现代", "毛泽东", "高一", "上", "长调", ["高中必背"]],
  ["劝学(节选)", "先秦", "荀子", "高一", "上", "中古文", ["高中必背"]],
  ["师说", "唐", "韩愈", "高一", "上", "中古文", ["高中必背"]],
  ["赤壁赋", "宋", "苏轼", "高一", "上", "长古文", ["高中必背"]],
  ["登高", "唐", "杜甫", "高一", "上", "七言律诗", ["高中必背"]],
  ["念奴娇·赤壁怀古", "宋", "苏轼", "高一", "上", "长调", ["高中必背"]],
  ["永遇乐·京口北固亭怀古", "宋", "辛弃疾", "高一", "上", "长调", ["高中必背"]],
  ["声声慢(寻寻觅觅)", "宋", "李清照", "高一", "上", "长调", ["高中必背"]],
  ["阿房宫赋", "唐", "杜牧", "高一", "上", "长古文", ["高中必背"]],
  ["六国论", "宋", "苏洵", "高一", "上", "长古文", ["高中必背"]],
  ["答司马谏议书", "宋", "王安石", "高一", "上", "中古文", ["高中必背"]],
  ["谏太宗十思疏", "唐", "魏征", "高一", "上", "中古文", ["高中必背"]],
  ["论语十二章", "先秦", "论语", "高一", "上", "短古文", ["高中必背"]],
  ["屈原列传(节选)", "汉", "司马迁", "高一", "上", "长古文", ["高中必背"]],
  ["逍遥游(节选)", "先秦", "庄子", "高一", "上", "中古文", ["高中必背"]],
  ["蜀道难", "唐", "李白", "高一", "上", "古诗", ["高中必背"]],
  ["将进酒", "唐", "李白", "高一", "上", "古诗", ["高中必背"]],
  ["归园田居(其一)", "晋", "陶渊明", "高一", "上", "古诗", ["高中必背"]],
  ["春江花月夜", "唐", "张若虚", "高一", "上", "古诗", ["高中必背"]],
  ["梦游天姥吟留别", "唐", "李白", "高一", "上", "古诗", ["高中必背"]],
  ["琵琶行(并序)", "唐", "白居易", "高一", "上", "古诗", ["高中必背"]],
  ["登快阁", "宋", "黄庭坚", "高二", "上", "七言律诗", ["高中必背"]],
  ["书愤", "宋", "陆游", "高二", "上", "七言律诗", ["高中必背"]],
  ["临安春雨初霁", "宋", "陆游", "高二", "上", "七言律诗", ["高中必背"]],
  ["念奴娇·过洞庭", "宋", "张孝祥", "高二", "上", "长调", ["高中必背"]],
  ["桂枝香·金陵怀古", "宋", "王安石", "高二", "上", "长调", ["高中必背"]],
  ["青玉案·元夕", "宋", "辛弃疾", "高二", "上", "中调", ["高中必背"]],
  ["扬州慢(淮左名都)", "宋", "姜夔", "高二", "上", "长调", ["高中必背"]],
  ["朝天子·咏喇叭", "明", "王磐", "高二", "上", "中古文", ["高中必背"]],
];

// 一键预录部编版必背
function seedCards() {
  const list = store.get(XS.cards, []);
  const seen = new Set(list.map((c) => (c.name || "") + "|" + (c.author || "") + "|" + (c.grade || "") + "|" + (c.term || "")));
  let added = 0;
  SEED_CARDS.forEach((s, i) => {
    const key = s[0] + "|" + s[2] + "|" + s[3] + "|" + s[4];
    if (seen.has(key)) return;
    seen.add(key);
    list.push({ name: s[0], dyn: s[1], author: s[2], grade: s[3], term: s[4], type: s[5], recite: s[6], status: "待制作", steps: {}, ts: Date.now() + i });
    added++;
  });
  store.set(XS.cards, list);
  renderCards();
  renderKpis(); renderFinance();
  $("#seedHint").textContent = added ? `已预录 ${added} 篇（重复已自动跳过）` : "部编版篇目已全部存在，无需重复添加";
  toast(added ? `部编版必背已预录 ${added} 篇 📚` : "已全部预录");
}

function saveFile(name, content, mime = "text/markdown;charset=utf-8") {
  const blob = new Blob([content], { type: mime });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

// ---------- 各板块 KPI + 财务 ----------
function renderKpis() {
  const students = store.get(XS.students, []);
  const leads = store.get(XS.leads, []);
  const cards = store.get(XS.cards, []);
  const reports = store.get(XS.reports, []);
  const expenses = store.get(XS.expenses, []);
  const courses = store.get(XS.courses, []);
  const ym = (new Date().getFullYear()) + "-" + String(new Date().getMonth() + 1).padStart(2, "0");
  const monthLeads = leads.filter((l) => (l.date || "").startsWith(ym)).length;
  const inTrial = leads.filter((l) => l.stage === "体验").length;
  const monthSign = leads.filter((l) => l.stage === "报名" && (l.date || "").startsWith(ym)).length;
  const cardsDone = cards.filter((c) => c.status === "已发布").length;
  const cardsTodo = cards.filter((c) => c.status === "待制作").length;
  const totalIncome = students.reduce((s, x) => s + (Number(x.fee) || 0), 0);
  const totalExpense = expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const monthExpense = expenses.filter((e) => (e.date || "").startsWith(ym)).reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const netProfit = totalIncome - totalExpense;

  // 学员档案 KPI
  $("#kpiStudents").innerHTML = [
    { label: "在册学员", value: students.length, sub: "学员档案" },
    { label: "测评报告", value: reports.length, sub: "已存档解读" },
  ].map(kpiHtml).join("");

  // 课程内容 KPI
  $("#kpiCourse").innerHTML = [
    { label: "古诗文卡片", value: cards.length, sub: "已发布 " + cardsDone + " · 待制作 " + cardsTodo },
    { label: "课程数", value: courses.length, sub: "课程目录在册" },
    { label: "卡片完成度", value: cards.length ? Math.round((cardsDone / cards.length) * 100) + "%" : "—", sub: "已发布占比" },
  ].map(kpiHtml).join("");

  // 经营数据 KPI
  $("#kpiBusiness").innerHTML = [
    { label: "学员总数", value: students.length, sub: "在册学员" },
    { label: "本月新线索", value: monthLeads, sub: "招生线索" },
    { label: "体验课在跑", value: inTrial, sub: "进行中" },
    { label: "本月报名", value: monthSign, sub: "已缴费" },
  ].map(kpiHtml).join("");

  // 项目财务 KPI
  $("#kpiFinance").innerHTML = [
    { label: "总收入", value: "¥" + totalIncome, sub: "学员缴费累计" },
    { label: "总支出", value: "¥" + totalExpense, sub: "各项支出累计" },
    { label: "净利润", value: "¥" + netProfit, sub: "收入 − 支出" },
    { label: "本月支出", value: "¥" + monthExpense, sub: ym },
  ].map(kpiHtml).join("");

  // 内容运营 KPI
  const materials = store.get(XS.materials, []);
  const productions = store.get(XS.productions, []);
  const schedules = store.get(XS.schedules, []);
  const metrics = store.get(XS.metrics, []);
  const prodWip = productions.filter((p) => p.status !== "已发布").length;
  const schedPending = schedules.filter((s) => s.status === "待发布").length;
  const totalConv = metrics.reduce((s, m) => s + (Number(m.conv) || 0), 0);
  $("#kpiContent").innerHTML = [
    { label: "素材库", value: materials.length, sub: "已收集" },
    { label: "制作中", value: prodWip, sub: "未发布任务" },
    { label: "待发布", value: schedPending, sub: "排期未发" },
    { label: "累计转化", value: totalConv, sub: "加微 / 报名" },
  ].map(kpiHtml).join("");
}
function kpiHtml(k) {
  return `<div class="kpi"><div class="kpi-label">${k.label}</div><div class="kpi-value">${k.value}</div><div class="kpi-trend">${k.sub}</div></div>`;
}

// 收入明细 + 支出列表
function renderFinance() {
  const students = store.get(XS.students, []);
  const feeStudents = students.filter((s) => Number(s.fee) > 0);
  $("#incomeList").innerHTML = feeStudents.length
    ? feeStudents.slice().reverse().map((s) => `
      <div class="entry">
        <div class="entry-body">
          <div class="entry-meta">${s.course || "—"} · ${s.status}</div>
          <div class="entry-text"><b>${escapeHtml(s.name)}</b> · 💰 ${Number(s.fee)} 元</div>
        </div>
      </div>`).join("")
    : '<div class="muted">还没有学员缴费记录</div>';

  const expenses = store.get(XS.expenses, []);
  $("#expList").innerHTML = expenses.length
    ? expenses.slice().reverse().map((e) => `
      <div class="entry">
        <div class="entry-body">
          <div class="entry-meta">${e.date || "—"} · ${e.cat}</div>
          <div class="entry-text"><b>${escapeHtml(e.item || "（无项目名）")}</b> · ➖ ${Number(e.amount)} 元${e.note ? " · " + escapeHtml(e.note) : ""}</div>
        </div>
        <button class="entry-del" data-k="${e.ts}">✕</button>
      </div>`).join("")
    : '<div class="muted">还没有支出记录</div>';
  $$("#expList .entry-del").forEach((b) =>
    b.addEventListener("click", () => {
      store.set(XS.expenses, store.get(XS.expenses, []).filter((y) => y.ts !== +b.dataset.k));
      renderFinance();
      renderKpis();
    })
  );
  renderCourseIncome();
}

// 各课程收入合计（按学员报班的课程名归属）
function renderCourseIncome() {
  const box = $("#courseIncome");
  if (!box) return;
  const students = store.get(XS.students, []);
  const map = {};
  students.forEach((s) => {
    if (s.fee != null) {
      const k = (s.course || "未关联课程").trim() || "未关联课程";
      map[k] = (map[k] || 0) + Number(s.fee);
    }
  });
  const arr = Object.entries(map).sort((a, b) => b[1] - a[1]);
  box.innerHTML = arr.length
    ? arr.map(([k, v]) => `
      <div class="entry">
        <div class="entry-body">
          <div class="entry-text"><b>${escapeHtml(k)}</b> · 💰 合计 ${v} 元</div>
        </div>
      </div>`).join("")
    : '<div class="muted">暂无收入可统计</div>';
}

// ---------- 内容运营 ----------
function renderMaterials() {
  const list = store.get(XS.materials, []).slice().reverse();
  $("#matList").innerHTML = list.length
    ? list.map((m) => `
      <div class="entry">
        <div class="entry-body">
          <div class="entry-meta">${m.type} · 来源：${m.from}</div>
          <div class="entry-text"><b>${escapeHtml(m.title)}</b>${m.url ? ` · <a href="${escapeHtml(m.url)}" target="_blank" rel="noopener">链接</a>` : ""}</div>
          ${m.note ? `<div class="entry-sub">${escapeHtml(m.note)}</div>` : ""}
        </div>
        <button class="entry-del" data-k="${m.ts}">✕</button>
      </div>`).join("")
    : '<div class="muted">素材库还是空的，看到好内容就顺手收进来吧</div>';
  $$("#matList .entry-del").forEach((b) =>
    b.addEventListener("click", () => {
      store.set(XS.materials, store.get(XS.materials, []).filter((y) => y.ts !== +b.dataset.k));
      renderMaterials();
      renderKpis();
    })
  );
  populateMatListData();
}

function populateMatListData() {
  const box = $("#matListData");
  if (!box) return;
  box.innerHTML = store.get(XS.materials, []).map((m) => `<option value="${escapeHtml(m.title)}">`).join("");
}

const prodFilter = { status: "" };
function renderProductions() {
  const all = store.get(XS.productions, []);
  const list = all
    .filter((p) => !prodFilter.status || p.status === prodFilter.status)
    .slice()
    .reverse();
  $("#prodCount").textContent = `共 ${list.length} / ${all.length} 条`;
  const color = (s) => ({ "选题中": "#c89b3c", "脚本中": "#d9a441", "制作中": "#2e9e5e", "已成型": "#3b82c4", "已发布": "#888" }[s] || "#888");
  $("#prodList").innerHTML = list.length
    ? list.map((p) => `
      <div class="entry">
        <div class="entry-body">
          <div class="entry-meta">${p.plat} · ${p.shape} · <b style="color:${color(p.status)}">${p.status}</b></div>
          <div class="entry-text"><b>${escapeHtml(p.title)}</b>${p.mat ? ` · 关联素材：${escapeHtml(p.mat)}` : ""}</div>
          ${p.note ? `<div class="entry-sub">${escapeHtml(p.note)}</div>` : ""}
        </div>
        <button class="entry-del" data-k="${p.ts}">✕</button>
      </div>`).join("")
    : '<div class="muted">还没有制作任务</div>';
  $$("#prodList .entry-del").forEach((b) =>
    b.addEventListener("click", () => {
      store.set(XS.productions, store.get(XS.productions, []).filter((y) => y.ts !== +b.dataset.k));
      renderProductions();
      renderKpis();
    })
  );
}

function renderSchedules() {
  const list = store.get(XS.schedules, []).slice().sort((a, b) => (a.date || "").localeCompare(b.date || ""));
  $("#schedList").innerHTML = list.length
    ? list.map((s) => `
      <div class="entry">
        <div class="entry-body">
          <div class="entry-meta">${s.plat} · ${s.date || "未排期"} · <b style="color:${s.status === "待发布" ? "var(--brand)" : (s.status === "已发布" ? "#888" : "#c89b3c")}">${s.status}</b></div>
          <div class="entry-text"><b>${escapeHtml(s.title)}</b>${s.url ? ` · <a href="${escapeHtml(s.url)}" target="_blank" rel="noopener">已发布</a>` : ""}</div>
          ${s.note ? `<div class="entry-sub">${escapeHtml(s.note)}</div>` : ""}
        </div>
        <button class="entry-del" data-k="${s.ts}">✕</button>
      </div>`).join("")
    : '<div class="muted">还没有排期</div>';
  $$("#schedList .entry-del").forEach((b) =>
    b.addEventListener("click", () => {
      store.set(XS.schedules, store.get(XS.schedules, []).filter((y) => y.ts !== +b.dataset.k));
      renderSchedules();
      renderKpis();
    })
  );
}

function renderMetrics() {
  const list = store.get(XS.metrics, []).slice().reverse();
  $("#metricList").innerHTML = list.length
    ? list.map((m) => `
      <div class="entry">
        <div class="entry-body">
          <div class="entry-meta">${m.plat} · ${m.date || "—"} · ${escapeHtml(m.title)}</div>
          <div class="entry-text">曝光 ${Number(m.view) || 0} · 👍 ${Number(m.like) || 0} · ⭐ ${Number(m.fav) || 0} · 💬 ${Number(m.cmt) || 0} · 🔁 ${Number(m.share) || 0} · 🎯 转化 ${Number(m.conv) || 0}</div>
        </div>
        <button class="entry-del" data-k="${m.ts}">✕</button>
      </div>`).join("")
    : '<div class="muted">还没有数据记录</div>';
  $$("#metricList .entry-del").forEach((b) =>
    b.addEventListener("click", () => {
      store.set(XS.metrics, store.get(XS.metrics, []).filter((y) => y.ts !== +b.dataset.k));
      renderMetrics();
      renderKpis();
    })
  );
  const box = $("#metricSummary");
  const map = {};
  list.forEach((m) => {
    if (!map[m.plat]) map[m.plat] = { view: 0, like: 0, fav: 0, cmt: 0, share: 0, conv: 0 };
    map[m.plat].view += Number(m.view) || 0;
    map[m.plat].like += Number(m.like) || 0;
    map[m.plat].fav += Number(m.fav) || 0;
    map[m.plat].cmt += Number(m.cmt) || 0;
    map[m.plat].share += Number(m.share) || 0;
    map[m.plat].conv += Number(m.conv) || 0;
  });
  const arr = Object.entries(map);
  box.innerHTML = arr.length
    ? arr.map(([k, v]) => `
      <div class="entry">
        <div class="entry-body">
          <div class="entry-text"><b>${escapeHtml(k)}</b> · 曝光 ${v.view} · 👍 ${v.like} · ⭐ ${v.fav} · 💬 ${v.cmt} · 🔁 ${v.share} · 🎯 转化 ${v.conv}</div>
        </div>
      </div>`).join("")
    : '<div class="muted">暂无数据可统计</div>';
}

$("#matForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const title = $("#matTitle").value.trim();
  if (!title) return;
  const list = store.get(XS.materials, []);
  list.push({ title, type: $("#matType").value, from: $("#matFrom").value, url: $("#matUrl").value.trim(), note: $("#matNote").value.trim(), ts: Date.now() });
  store.set(XS.materials, list);
  e.target.reset();
  renderMaterials();
  renderKpis();
  toast("素材已收藏 📥");
});

$("#prodForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const title = $("#prodTitle").value.trim();
  if (!title) return;
  const list = store.get(XS.productions, []);
  list.push({ title, plat: $("#prodPlat").value, shape: $("#prodShape").value, status: $("#prodStatus").value, mat: $("#prodMat").value.trim(), note: $("#prodNote").value.trim(), ts: Date.now() });
  store.set(XS.productions, list);
  e.target.reset();
  renderProductions();
  renderKpis();
  toast("制作任务已添加 🛠️");
});
$("#prodFilterStatus").addEventListener("change", (e) => { prodFilter.status = e.target.value; renderProductions(); });
$("#prodFilterClear").addEventListener("click", () => { prodFilter.status = ""; $("#prodFilterStatus").value = ""; renderProductions(); });

$("#schedForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const title = $("#schedTitle").value.trim();
  if (!title) return;
  const list = store.get(XS.schedules, []);
  list.push({ title, plat: $("#schedPlat").value, date: $("#schedDate").value, status: $("#schedStatus").value, url: $("#schedUrl").value.trim(), note: $("#schedNote").value.trim(), ts: Date.now() });
  store.set(XS.schedules, list);
  e.target.reset();
  renderSchedules();
  renderKpis();
  toast("已排期 📅");
});

$("#metricForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const title = $("#metricTitle").value.trim();
  if (!title) return;
  const list = store.get(XS.metrics, []);
  list.push({
    plat: $("#metricPlat").value, title, date: $("#metricDate").value,
    view: $("#metricView").value, like: $("#metricLike").value, fav: $("#metricFav").value,
    cmt: $("#metricCmt").value, share: $("#metricShare").value, conv: $("#metricConv").value, ts: Date.now()
  });
  store.set(XS.metrics, list);
  e.target.reset();
  renderMetrics();
  renderKpis();
  toast("数据已记录 📈");
});

// 学员能力快照网格
function buildXsRatingGrid() {
  $("#xsRating").innerHTML = ABILITIES.map((a) =>
    `<div class="rate-item"><label>${a}</label><select data-ab="${a}"><option>优</option><option>良</option><option>中</option><option>待提升</option></select></div>`
  ).join("");
}

// ---------- 学员档案 ----------
$("#xsForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const name = $("#xsName").value.trim();
  if (!name) return;
  const list = store.get(XS.students, []);
  const abilities = {};
  let hasAb = false;
  ABILITIES.forEach((a) => {
    const v = $(`#xsRating select[data-ab="${a}"]`).value;
    abilities[a] = v;
    if (v) hasAb = true;
  });
  list.push({
    name,
    grade: $("#xsGrade").value.trim(),
    source: $("#xsSource").value.trim(),
    course: $("#xsCourse").value.trim(),
    fee: $("#xsFee").value ? Number($("#xsFee").value) : null,
    abilities: hasAb ? abilities : null,
    status: $("#xsStatus").value,
    ts: Date.now(),
  });
  store.set(XS.students, list);
  e.target.reset();
  buildXsRatingGrid();
  renderXs();
  renderKpis(); renderFinance();
  toast("学员已添加 📚");
});
const xsFilter = { q: "", status: "" };
function renderXs() {
  const all = store.get(XS.students, []);
  const q = xsFilter.q.trim().toLowerCase();
  const list = all
    .filter((x) => {
      if (q) {
        const hay = (x.name + " " + (x.grade || "") + " " + (x.source || "")).toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (xsFilter.status && x.status !== xsFilter.status) return false;
      return true;
    })
    .slice()
    .reverse();
  $("#xsCount").textContent = `共 ${list.length} / ${all.length} 人`;
  $("#xsList").innerHTML = list.length
    ? list.map((x) => `
      <div class="entry">
        <div class="entry-body">
          <div class="entry-meta">${x.grade || "—"} · ${x.course || "—"} · <b style="color:var(--brand)">${x.status}</b>${x.fee != null ? `<span class="xs-fee">💰 ${x.fee} 元</span>` : ""}</div>
          <div class="entry-text"><b>${escapeHtml(x.name)}</b>${x.source ? " · 来源：" + escapeHtml(x.source) : ""}</div>
          ${x.abilities ? `<div class="rate-tags xs-abilities-tags">${ABILITIES.map((a) => `<span class="rate-tag">${a}：${x.abilities[a]}</span>`).join("")}</div>` : ""}
        </div>
        <button class="entry-del" data-k="${x.ts}">✕</button>
      </div>`).join("")
    : '<div class="muted">没有匹配的学员，试试调整筛选条件</div>';
  $$("#xsList .entry-del").forEach((b) =>
    b.addEventListener("click", () => {
      store.set(XS.students, store.get(XS.students, []).filter((y) => y.ts !== +b.dataset.k));
      renderXs();
      renderKpis(); renderFinance();
    })
  );
}

// 学员档案筛选
$("#xsSearch").addEventListener("input", (e) => { xsFilter.q = e.target.value; renderXs(); });
$("#xsFilterStatus").addEventListener("change", (e) => { xsFilter.status = e.target.value; renderXs(); });
$("#xsFilterClear").addEventListener("click", () => {
  xsFilter.q = ""; xsFilter.status = "";
  $("#xsSearch").value = ""; $("#xsFilterStatus").value = "";
  renderXs();
});

// ---------- 课程目录（关联学员报班与财务收入） ----------
// 把课程目录同步到学员「报名课程」的 datalist，便于选课
function populateXsCourseSelect() {
  const courses = store.get(XS.courses, []);
  const dl = $("#xsCourseList");
  if (dl) dl.innerHTML = courses.map((c) => `<option value="${escapeHtml(c.name)}">`).join("");
}
// 选课时自动带出该课程定价到缴费金额
$("#xsCourse").addEventListener("input", () => {
  const name = $("#xsCourse").value.trim();
  const c = store.get(XS.courses, []).find((x) => x.name === name);
  if (c && c.price) $("#xsFee").value = c.price;
});
// 录入课程
$("#courseForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const name = $("#courseName").value.trim();
  if (!name) return;
  const list = store.get(XS.courses, []);
  list.push({
    name,
    cycle: $("#courseCycle").value.trim(),
    mode: $("#courseMode").value,
    price: $("#coursePrice").value ? Number($("#coursePrice").value) : 0,
    status: $("#courseStatus").value,
    desc: $("#courseDesc").value.trim(),
    ts: Date.now(),
  });
  store.set(XS.courses, list);
  e.target.reset();
  renderCourses();
  populateXsCourseSelect();
  renderKpis();
  toast("课程已录入 🗂️");
});
function renderCourses() {
  const list = store.get(XS.courses, []).slice().reverse();
  $("#courseList").innerHTML = list.length
    ? list.map((c) => `
      <div class="entry">
        <div class="entry-body">
          <div class="entry-meta">${c.cycle || "—"} · ${c.mode} · <b style="color:var(--brand)">${c.status}</b>${c.price ? `<span class="xs-fee">💰 ${c.price} 元</span>` : ""}</div>
          <div class="entry-text"><b>${escapeHtml(c.name)}</b></div>
          ${c.desc ? `<div class="entry-note">${escapeHtml(c.desc)}</div>` : ""}
        </div>
        <button class="entry-del" data-k="${c.ts}">✕</button>
      </div>`).join("")
    : '<div class="muted">还没有课程，录入第一节课吧</div>';
  $$("#courseList .entry-del").forEach((b) =>
    b.addEventListener("click", () => {
      store.set(XS.courses, store.get(XS.courses, []).filter((y) => y.ts !== +b.dataset.k));
      renderCourses();
      populateXsCourseSelect();
      renderKpis();
    })
  );
}

// ---------- 招生漏斗 ----------
$("#leadForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const name = $("#leadName").value.trim();
  if (!name) return;
  const list = store.get(XS.leads, []);
  list.push({
    date: $("#leadDate").value || todayStr(),
    name,
    src: $("#leadSrc").value.trim(),
    stage: $("#leadStage").value,
    ts: Date.now(),
  });
  store.set(XS.leads, list);
  e.target.reset();
  renderFunnel();
  renderKpis(); renderFinance();
  toast("线索已录入");
});
function renderFunnel() {
  const list = store.get(XS.leads, []);
  const stages = ["咨询", "体验", "报名"];
  const counts = stages.map((s) => list.filter((l) => l.stage === s).length);
  const max = Math.max(...counts, 1);
  const total = list.length;
  let html = `<div class="fn-meta"><span>招生漏斗（共 ${total} 条线索）</span></div>`;
  stages.forEach((s, i) => {
    const w = Math.max((counts[i] / max) * 100, 8);
    const gold = i === 2;
    const conv = i > 0 && counts[i - 1] ? "转化自上一阶段：" + Math.round((counts[i] / counts[i - 1]) * 100) + "%" : "入口";
    html += `
      <div class="fn-stage">
        <div class="fn-meta"><span>${s}</span><span>${counts[i]} 人</span></div>
        <div class="fn-bar-wrap"><div class="fn-bar ${gold ? "gold" : ""}" style="width:${w}%">${counts[i]}</div></div>
        ${i < stages.length - 1 ? `<div class="fn-conv">↓ ${conv}</div>` : ""}
      </div>`;
  });
  const recent = list.slice(-8).reverse();
  html += `<div class="entry-list" style="margin-top:14px">` +
    (recent.length
      ? recent.map((l) => `
        <div class="entry">
          <div class="entry-body">
            <div class="entry-meta">${l.date} · ${l.src || "—"}</div>
            <div class="entry-text"><b>${escapeHtml(l.name)}</b> · ${l.stage}</div>
          </div>
          <button class="entry-del" data-k="${l.ts}">✕</button>
        </div>`).join("")
      : '<div class="muted">还没有线索</div>') +
    `</div>`;
  $("#funnelView").innerHTML = html;
  $$("#funnelView .entry-del").forEach((b) =>
    b.addEventListener("click", () => {
      store.set(XS.leads, store.get(XS.leads, []).filter((y) => y.ts !== +b.dataset.k));
      renderFunnel();
      renderKpis(); renderFinance();
    })
  );
  renderSrcStats(list);
}

// 按来源统计线索分布
function renderSrcStats(list) {
  const map = {};
  list.forEach((l) => { const k = (l.src || "未填写").trim() || "未填写"; map[k] = (map[k] || 0) + 1; });
  const arr = Object.entries(map).sort((a, b) => b[1] - a[1]);
  const box = $("#srcStats");
  if (!box) return;
  if (!arr.length) { box.innerHTML = ""; return; }
  const max = Math.max(...arr.map((x) => x[1]));
  box.innerHTML = `<h4>📊 按来源统计（哪个渠道来的线索多）</h4>` +
    arr.map(([k, v]) => `
      <div class="src-bar-row">
        <div class="src-name">${escapeHtml(k)}</div>
        <div class="src-bar-bg"><div class="src-bar-fill" style="width:${Math.max((v / max) * 100, 6)}%"></div></div>
        <div class="src-num">${v} 条</div>
      </div>`).join("");
}

// 六步法进度迷你点（看·红 / 读·橙 / 析·黄 / 构·绿 / 记·蓝 / 忆·紫）
function renderSteps(steps) {
  if (!steps) return "";
  const order = ["看", "读", "析", "构", "记", "忆"];
  const idx = { 看: 1, 读: 2, 析: 3, 构: 4, 记: 5, 忆: 6 };
  return `<div class="steps-mini">` + order.map((s) =>
    `<span class="step-dot ${steps[s] ? "s" + idx[s] : "off"}" title="${s}">${s}</span>`
  ).join("") + `</div>`;
}

// ---------- 古诗文卡片 ----------
let cardImgData = null;
$("#cardImg").addEventListener("change", async (e) => {
  const f = e.target.files[0];
  if (!f) return;
  cardImgData = await fileToDataURL(f);
  const prev = $("#cardImgPreview");
  prev.src = cardImgData;
  prev.style.display = "block";
});
$("#cardForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const name = $("#cardName").value.trim();
  if (!name) return;
  const steps = {};
  $$("#cardSteps input[type=checkbox]").forEach((c) => { steps[c.dataset.step] = c.checked; });
  const recite = $$("#cardRecite input[type=checkbox]").filter((c) => c.checked).map((c) => c.dataset.phase);
  const list = store.get(XS.cards, []);
  list.push({
    name,
    dyn: $("#cardDyn").value.trim(),
    author: $("#cardAuthor").value.trim(),
    type: $("#cardType").value,
    grade: $("#cardGrade").value,
    term: $("#cardTerm").value,
    recite,
    status: $("#cardStatus").value,
    steps,
    img: cardImgData,
    ts: Date.now(),
  });
  store.set(XS.cards, list);
  e.target.reset();
  cardImgData = null;
  $("#cardImgPreview").style.display = "none";
  renderCards();
  renderKpis(); renderFinance();
  toast("卡片已登记");
});
const cardFilter = { q: "", type: "", recite: "", status: "" };
function renderCards() {
  const all = store.get(XS.cards, []);
  const q = cardFilter.q.trim().toLowerCase();
  const list = all
    .filter((c) => {
      if (q) {
        const hay = (c.name + " " + (c.author || "") + " " + (c.dyn || "")).toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (cardFilter.type && c.type !== cardFilter.type) return false;
      if (cardFilter.recite && !(c.recite && c.recite.includes(cardFilter.recite))) return false;
      if (cardFilter.status && c.status !== cardFilter.status) return false;
      return true;
    })
    .slice()
    .reverse();
  $("#cardCount").textContent = `共 ${list.length} / ${all.length} 首`;
  $("#cardList").innerHTML = list.length
    ? list.map((c) => `
      <div class="entry">
        <div class="entry-body">
          <div class="entry-meta">${(c.grade || "") + (c.term || "") || "—"} · ${c.dyn || "—"} · ${c.author || "—"}<span class="type-badge">${escapeHtml(c.type || "—")}</span> · <b style="color:var(--brand)">${c.status}</b></div>
          <div class="entry-text"><b>${escapeHtml(c.name)}</b></div>
          ${c.recite && c.recite.length ? `<div class="rate-tags"><span class="rate-tag" style="background:#fbf3e2;color:var(--gold)">${c.recite.join(" · ")}</span></div>` : ""}
          ${renderSteps(c.steps)}
          ${c.img ? `<img src="${c.img}" alt="记忆卡片" style="max-width:150px;max-height:150px;border-radius:8px;border:1px solid var(--line);margin-top:8px" />` : ""}
        </div>
        <button class="entry-del" data-k="${c.ts}">✕</button>
      </div>`).join("")
    : '<div class="muted">没有匹配的卡片，试试调整筛选条件</div>';
  $$("#cardList .entry-del").forEach((b) =>
    b.addEventListener("click", () => {
      store.set(XS.cards, store.get(XS.cards, []).filter((y) => y.ts !== +b.dataset.k));
      renderCards();
      renderKpis(); renderFinance();
    })
  );
}

// ---------- 测评报告 ----------
function buildRatingGrid() {
  $("#repRating").innerHTML = ABILITIES.map((a) =>
    `<div class="rate-item"><label>${a}</label><select data-ab="${a}"><option>优</option><option>良</option><option>中</option><option>待提升</option></select></div>`
  ).join("");
}
$("#repForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const name = $("#repName").value.trim();
  if (!name) return;
  const ratings = {};
  ABILITIES.forEach((a) => { ratings[a] = $(`#repRating select[data-ab="${a}"]`).value; });
  const list = store.get(XS.reports, []);
  list.push({
    name,
    date: $("#repDate").value || todayStr(),
    grade: $("#repGrade").value.trim(),
    ratings,
    note: $("#repNote").value.trim(),
    ts: Date.now(),
  });
  store.set(XS.reports, list);
  e.target.reset();
  buildRatingGrid();
  renderReports();
  renderKpis(); renderFinance();
  toast("测评报告已存档 📑");
});
function renderReports() {
  const list = store.get(XS.reports, []).slice().reverse();
  $("#repList").innerHTML = list.length
    ? list.map((r) => {
        const tags = ABILITIES.map((a) => `<span class="rate-tag">${a}：${r.ratings[a]}</span>`).join("");
        return `
        <div class="entry">
          <div class="entry-body">
            <div class="entry-meta">${r.date} · ${r.grade || "—"}</div>
            <div class="entry-text"><b>${escapeHtml(r.name)}</b></div>
            <div class="rate-tags">${tags}</div>
            ${r.note ? `<div class="entry-note">${escapeHtml(r.note)}</div>` : ""}
          </div>
          <button class="entry-del" data-k="${r.ts}">✕</button>
        </div>`;
      }).join("")
    : '<div class="muted">还没有测评报告</div>';
  $$("#repList .entry-del").forEach((b) =>
    b.addEventListener("click", () => {
      store.set(XS.reports, store.get(XS.reports, []).filter((y) => y.ts !== +b.dataset.k));
      renderReports();
      renderKpis(); renderFinance();
    })
  );
}

// ---------- 子标签切换 ----------
$$("#xingTabs .tab").forEach((t) =>
  t.addEventListener("click", () => {
    $$("#xingTabs .tab").forEach((x) => x.classList.remove("active"));
    t.classList.add("active");
    $$(".xtab").forEach((x) => x.classList.remove("active"));
    $("#tab-" + t.dataset.tab).classList.add("active");
  })
);

// ---------- 导出 Markdown ----------
$("#btnExportXing").addEventListener("click", () => {
  const students = store.get(XS.students, []);
  const leads = store.get(XS.leads, []);
  const cards = store.get(XS.cards, []);
  const reports = store.get(XS.reports, []);
  let md = `# 映思学堂数据导出\n\n> 导出时间：${new Date().toLocaleString()}\n\n`;
  md += `## 学员档案（${students.length}）\n`;
  students.forEach((s) => {
    md += `- **${s.name}** | ${s.grade || "—"} | ${s.course || "—"} | ${s.status} | 来源：${s.source || "—"} | 缴费：${s.fee != null ? s.fee + "元" : "—"}\n`;
    if (s.abilities) md += `  - 能力快照：` + ABILITIES.map((a) => `${a}:${s.abilities[a]}`).join("，") + `\n`;
  });
  md += `\n## 招生线索（${leads.length}）\n`;
  leads.forEach((l) => { md += `- ${l.date} | ${l.name} | ${l.stage} | ${l.src || "—"}\n`; });
  md += `\n## 古诗文卡片（${cards.length}）\n`;
  cards.forEach((c) => {
    const stepTxt = c.steps ? ["看", "读", "析", "构", "记", "忆"].filter((s) => c.steps[s]).join("") : "";
    const ce = (c.grade || "") + (c.term || "");
    const rec = c.recite && c.recite.length ? c.recite.join("、") : "—";
    md += `- **${c.name}** | ${ce || "—"} | ${c.dyn || "—"} | ${c.author || "—"} | ${c.type || "—"} | ${c.status} | 必背：${rec}` + (stepTxt ? ` | 六步：${stepTxt}` : "") + (c.img ? ` | 有卡片图` : "") + `\n`;
  });
  md += `\n## 测评报告（${reports.length}）\n`;
  reports.forEach((r) => {
    md += `- **${r.name}** | ${r.date} | ${r.grade || "—"}\n`;
    ABILITIES.forEach((a) => { md += `  - ${a}：${r.ratings[a]}\n`; });
    if (r.note) md += `  - 摘要：${r.note}\n`;
  });
  const courses = store.get(XS.courses, []);
  md += `\n## 课程目录（${courses.length}）\n`;
  courses.forEach((c) => {
    const line = `- **${c.name}** | 周期：${c.cycle || "—"} | 形式：${c.mode} | 定价：${c.price || 0} 元 | ${c.status}`;
    md += c.desc ? line + ` | ${c.desc}\n` : line + `\n`;
  });
  const expenses = store.get(XS.expenses, []);
  const totalIncome = students.reduce((s, x) => s + (Number(x.fee) || 0), 0);
  const totalExpense = expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  md += `\n## 项目财务\n`;
  md += `- 总收入（学员缴费累计）：${totalIncome} 元\n`;
  md += `- 总支出（累计）：${totalExpense} 元\n`;
  md += `- 净利润：${totalIncome - totalExpense} 元\n`;
  md += `### 支出明细（${expenses.length}）\n`;
  expenses.forEach((e) => { md += `- ${e.date} | ${e.cat} | ${e.item} | ${e.amount} 元${e.note ? " | " + e.note : ""}\n`; });
  md += `\n## 各课程收入合计\n`;
  const cmap = {};
  students.forEach((s) => { if (s.fee != null) { const k = (s.course || "未关联课程").trim() || "未关联课程"; cmap[k] = (cmap[k] || 0) + Number(s.fee); } });
  Object.entries(cmap).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => { md += `- ${k}：${v} 元\n`; });

  // 内容运营
  const materials = store.get(XS.materials, []);
  const productions = store.get(XS.productions, []);
  const schedules = store.get(XS.schedules, []);
  const metrics = store.get(XS.metrics, []);
  md += `\n## 内容运营\n`;
  md += `### 素材库（${materials.length}）\n`;
  materials.forEach((m) => { md += `- [${m.type}] ${m.title} | 来源：${m.from}${m.url ? " | " + m.url : ""}${m.note ? " | " + m.note : ""}\n`; });
  md += `### 制作任务（${productions.length}）\n`;
  productions.forEach((p) => { md += `- ${p.title} | ${p.plat} | ${p.shape} | ${p.status}${p.mat ? " | 关联素材：" + p.mat : ""}${p.note ? " | " + p.note : ""}\n`; });
  md += `### 发布计划（${schedules.length}）\n`;
  schedules.forEach((s) => { md += `- ${s.date || "未排期"} | ${s.plat} | ${s.status} | ${s.title}${s.url ? " | " + s.url : ""}${s.note ? " | " + s.note : ""}\n`; });
  md += `### 数据跟踪（${metrics.length}）\n`;
  metrics.forEach((m) => { md += `- ${m.date || "—"} | ${m.plat} | ${m.title} | 曝光${m.view || 0} 赞${m.like || 0} 藏${m.fav || 0} 评${m.cmt || 0} 转${m.share || 0} 转化${m.conv || 0}\n`; });

  saveFile(`映思学堂数据_${todayStr()}.md`, md);
});

// ---------- 预录按钮 ----------
$("#btnSeedCards").addEventListener("click", seedCards);

// ---------- 卡片搜索 / 筛选 ----------
$("#cardSearch").addEventListener("input", (e) => { cardFilter.q = e.target.value; renderCards(); });
$("#cardFilterType").addEventListener("change", (e) => { cardFilter.type = e.target.value; renderCards(); });
$("#cardFilterRecite").addEventListener("change", (e) => { cardFilter.recite = e.target.value; renderCards(); });
$("#cardFilterStatus").addEventListener("change", (e) => { cardFilter.status = e.target.value; renderCards(); });
$("#cardFilterClear").addEventListener("click", () => {
  cardFilter.q = ""; cardFilter.type = ""; cardFilter.recite = ""; cardFilter.status = "";
  $("#cardSearch").value = ""; $("#cardFilterType").value = ""; $("#cardFilterRecite").value = ""; $("#cardFilterStatus").value = "";
  renderCards();
});

// ---------- 支出录入 ----------
$("#expForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const item = $("#expItem").value.trim();
  const amount = Number($("#expAmount").value) || 0;
  if (!item || !amount) return;
  const list = store.get(XS.expenses, []);
  list.push({
    date: $("#expDate").value || todayStr(),
    item,
    cat: $("#expCat").value,
    amount,
    note: $("#expNote").value.trim(),
    ts: Date.now(),
  });
  store.set(XS.expenses, list);
  e.target.reset();
  renderFinance();
  renderKpis();
  toast("支出已记录");
});

// ---------- 初始化 ----------
buildRatingGrid();
buildXsRatingGrid();
if (store.get(XS.cards, []).length === 0) seedCards();
renderXs();
renderFunnel();
renderCards();
renderReports();
renderCourses();
populateXsCourseSelect();
renderMaterials();
renderProductions();
renderSchedules();
renderMetrics();
renderKpis();
renderFinance();
