// ===== 中文翻译词典 =====
//
// 从 index.html 抽出来的纯数据：目录译名、界面标签、舰名人名、以及 trText() 用的
// 精确表 ZH_EXACT 和规则表 ZH_PATTERNS。整块没有一个函数声明，也不在加载时读任何
// 游戏状态——这是它能被安全搬走的原因。
//
// 和 js/terrain.js 一样用普通 <script> 加载、共享全局作用域，没有构建步骤。必须在
// 主内联脚本**之前**加载：那段脚本会往 ZH_EXACT 上 Object.assign 补翻条目。
// ZH_PATTERNS 里的 R()/SUM() 引用了 trName()，但都在箭头函数体内，等到真正翻译时
// 才求值，那时主脚本早已就位。

// ---------- i18n dictionaries: 中文翻译字典（生成于目录与提示语清单，英文缺译时自动回退） ----------
// Iron Tide 简体中文目录字典 — 由 catTr()/trName() 在运行时读取；键与 index.html 目录 id / 英文显示名严格一致。

// ---------- 舰船 ----------
const SHIPS_ZH = {

  // 上游新增的其他舰船
  frigate: { name:'导弹护卫舰', cls:'护航舰', desc:'灵活的导弹护卫舰——又快又轻,负责给舰队打掩护,把来袭的飞机从天上拍下来。' },
  battlecruiser: { name:'战列巡洋舰', cls:'快速主力舰', desc:'把战列舰的巨炮装在又瘦又快的船体上——火力赶得上主力舰,但装甲带很薄。打不过的就跑给它看。' },
  monitor: { name:'近岸浅水重炮舰', cls:'炮台舰', desc:'又矮又平、几乎不会动——但装甲厚得像碉堡,还扛着几门超大口径的炮。一座专打岸轰的浮动堡垒。' },
  akagi: { name:'赤城号', cls:'舰队航母', desc:'偷袭珍珠港的机动部队旗舰,传奇航母。三层飞行甲板和庞大的舰载机队——远程打击毁天灭地,但装甲薄,记得让僚舰护好她。' },
  pt109: { name:'PT-109 鱼雷艇', cls:'集市鱼雷快艇', desc:'集市舰船。胶合板、两台发动机和一股狠劲——最快也最脆。' },
  visby: { name:'维斯比级', cls:'集市隐身护卫舰', desc:'集市舰船。棱角分明的碳纤维护卫舰：小、快、难被发现。' },
  typhoon: { name:'台风级', cls:'集市弹道导弹潜艇', desc:'集市舰船。史上最大的潜艇：又慢又巨大，但特别能扛。按 C 下潜。' },
  qelizabeth: { name:'伊丽莎白女王号', cls:'集市现代航母', desc:'集市舰船。双舰岛超级航母，滑跃甲板，飞行甲板最宽敞。' },
  burke: { name:'伯克级', cls:'集市导弹驱逐舰', desc:'集市舰船。最能干的导弹驱逐舰：快、结实、炮位多。' },
  grafzeppelin: { name:'齐柏林伯爵号', cls:'集市舰队航母', desc:'集市舰船。永远没造完的那条航母——整条飞行甲板，舷侧还留着真炮。' },
  seawolf: { name:'海狼号', cls:'集市攻击潜艇', desc:'集市舰船。集市里唯一的潜艇：下潜更深，打得更狠。按 C 下潜。' },
  zumwalt: { name:'朱姆沃尔特号', cls:'集市隐身驱逐舰', desc:'集市舰船。棱角分明的隐身船体：同样长度里算轻的，甲板每一米都用得上。' },
  kirov: { name:'基洛夫号', cls:'集市战列巡洋舰', desc:'集市舰船。巨型导弹战列巡洋舰——炮位比海上任何一条船都多，而且扛得住让你一直用。' },
  fletcher: { name:'弗莱彻号', cls:'集市驱逐舰', desc:'集市舰船。历史上著名的弗莱彻级驱逐舰:快、皮实,甲板空间特别实用。' },
  type055: { name:'055型', cls:'集市导弹巡洋舰', desc:'集市舰船。现代大型导弹驱逐舰/巡洋舰,武器甲板宽阔,生存能力出色。' },
  nimitz: { name:'尼米兹号', cls:'集市超级航母', desc:'集市舰船。核动力超级航母:巨大的飞行甲板、结实的船体,足够打一场像样的空中战争。' },
  // 传奇旗舰(上游新增)
  bismarck: { name:'俾斯麦号', cls:'传奇战列舰', desc:'二战德国最令人生畏的战列舰——第三轮齐射就击沉了胡德号,随后整个皇家海军倾巢出动将她围猎。装甲带厚得能扛住轻型炮火,炮位充足,但转向比小船慢。' },
  enterprise: { name:'企业号', cls:'传奇航空母舰', desc:'"大E"——二战获得荣誉最多的战舰。中途岛、瓜岛……几乎每场太平洋大战都有她,而且从未被击沉。一块经得起打、始终能放飞机的均衡飞行甲板。' },
  missouri: { name:'密苏里号', cls:'传奇战列舰', desc:'"强大的密苏里"——衣阿华级战列舰,同类中的巅峰,1945年日本就是在她的甲板上签字投降的。全舰队最坚固的船体。' },
  iowa: { name:'衣阿华号', cls:'传奇战列舰', desc:'美国海军史上最快、火力最猛的战列舰级别的首舰。密苏里号的姊妹舰——几乎一样结实,一样随时准备战斗。' },
  arizona: { name:'亚利桑那号', cls:'传奇战列舰', desc:'一艘较老的"标准型"战列舰,在珍珠港沉没,没来得及还手。现在开着她出海,替历史补上那一仗。' },
  hmshood: { name:'胡德号', cls:'传奇战列巡洋舰', desc:'"威武的胡德"——皇家海军的骄傲,航速快、火炮多,但装甲带是她唯一的弱点。历史记得俾斯麦号找到这个弱点时发生了什么。' },
  hmsdreadnought: { name:'无畏号', cls:'传奇战列舰', desc:'1906年的一场革命——她让全世界其他战列舰一夜过时,这一舰种至今仍以她的名字命名。以现代标准看她并不起眼,但一切都是从她开始的。' },
  arkroyal: { name:'皇家方舟号', cls:'传奇航空母舰', desc:'一位著名的猎手——她的鱼雷机打坏了俾斯麦号的船舵,锁定了那场围猎的结局。比大型航母更灵活轻巧的飞行甲板。' },
  yamato: { name:'大和号', cls:'传奇战列舰', desc:'有史以来最大、最强的战列舰——近乎传说的巨舰,在战争尾声被派上了一条单程航线。论块头仅次于利维坦。' },
  musashi: { name:'武藏号', cls:'传奇战列舰', desc:'大和号的姊妹舰,同样庞大却少有人记得——她扛住了狂风暴雨般的鱼雷和炸弹才最终沉没。带她赢回历史欠她的荣耀吧。' },
  aurora: { name:'阿芙乐尔号', cls:'传奇巡洋舰', desc:'一艘俄国巡洋舰,一发空包弹宣告了一场革命的开始。在周围的巨舰旁她又小又旧,却照样改变了历史。' },
  richelieu: { name:'黎塞留号', cls:'传奇战列舰', desc:'法国最强的二战战列舰——她从沦陷的法国突围而出,宁可继续为同盟国而战,也不交出自己的火炮。' },
  zhiyuan: { name:'致远号', cls:'传奇巡洋舰', desc:'一艘清朝巡洋舰,1894年黄海海战中弹尽粮绝——管带邓世昌选择撞向敌阵,与舰同沉。航速快,但装甲薄。' },
  dingyuan: { name:'定远号', cls:'传奇战列舰', desc:'北洋水师旗舰,当年亚洲最强的铁甲舰。黄海海战中她中弹数百发仍在战斗——一块打不烂的装甲砖,就是为扛住一切而造的。' },
  liaoning: { name:'辽宁号', cls:'传奇航空母舰', desc:'中国第一艘航空母舰——由苏联舰体改建,让中国海军航空兵登上了世界舞台。全舰队最长的飞行甲板。' },
  scout:      { name:'侦察巡逻舰', cls:'快速哨舰', desc:'小巧又飞快。炮位少、船壳薄——打了就跑。' },
  submarine:  { name:'攻击潜艇',   cls:'潜水艇',   desc:'按 C 下潜——潜在水下时敌人看不见你，火炮也打不到你，但你只能用鱼雷。想用甲板炮就得上浮。' },
  destroyer:  { name:'驱逐舰',     cls:'护航舰',   desc:'全能选手。速度、船体和炮位都很均衡。' },
  cruiser:    { name:'重巡洋舰',   cls:'战列线舰', desc:'炮更重、装甲带更结实，甲板空间也很充足。' },
  pincurchin:{ name:'海胆号', cls:'共和国等离子战列舰', desc:'2054 年的等离子战列舰，也是全游戏唯一一艘出厂就带枪的军舰：四门等离子转管炮，每门每秒二十发。船舷两侧插满通着电的长刺。单发威力很小，所以装甲挡得住、距离也会把它耗光——但任何长翅膀的东西都别想从她头顶飞过去。' },
  missilecruiser:{ name:'导弹巡洋舰', cls:'导弹舰', desc:'前甲板上是一整片垂直发射单元。只有她能装 Kh-35 掠海导弹——两千米射程，全场最远，代价是威力不大，而且只擅长打船、不擅长砸海港。舰上每一个导弹炮位的装填都快上约四分之一，出港时就已经装好了一发 Kh-35 和一具防空导弹。为了塞下这些发射井，船体造得比重巡洋舰更薄。' },
  battleship: { name:'战列舰',     cls:'主力舰',   desc:'装甲厚、主炮大。开得慢，但一炮一个疼。' },
  dreadnought:{ name:'无畏舰',     cls:'超级主力舰', desc:'一座会漂的堡垒。炮位密密麻麻，船体巨大。' },
  boss:       { name:'利维坦',     cls:'首领战舰', desc:'每方只有一艘。缓慢的装甲旗舰，自带十二门炮，火力吓人，沉了就没有第二艘。' },
  carrier:    { name:'航空母舰',   cls:'平顶船',   desc:'宽阔的飞行甲板随你跑，舰岛在右舷。还带炸弹舱。' },
};
const FLEET_TENDER_ZH = { name:'舰队补给舰', cls:'支援舰', desc:'' };

// ---------- 甲板武器（desc 留空，数据行由代码生成） ----------
const WEAPONS_ZH = {
  mortar:  { name:'甲板迫击炮', desc:'便宜、弹道陡，能扔到掩体后面。' },
  beamcannon:{ name:'Mk 12 光束炮', desc:'连续能量束，不用提前量。' },
  flak88:  { name:'88 毫米 Flak 36', desc:'有名的两用炮：打飞机，也打船。' },
  harpoon: { name:'鱼叉反舰导弹', desc:'射程远超甲板上任何一门炮。' },
  plasmamini:{ name:'等离子转管炮', desc:'每秒二十发，全场射速最快。单发只有 10 点伤害，所以打有装甲的东西不疼、打远了更不疼——但打飞机是一堵火墙。' },
  kh35:    { name:'Kh-35 掠海导弹', desc:'全游戏射程最远的一发——两千米，差不多是战斧的三倍。代价是威力很小、装填也慢，而且它是反舰弹：贴着海面飞，打船很好用，砸海港几乎不掉血。只能装进导弹巡洋舰的垂直发射单元里。' },
  katyusha:{ name:'BM-13 火箭炮架', desc:'六联齐射：不讲瞄准，讲把那一片全覆盖。' },
  railmount:{ name:'Mk 9 电磁炮', desc:'弹道笔直、初速极快，指哪打哪，就是充能慢。' },
  deckgun: { name:'甲板炮', desc:'' },
  aa:      { name:'防空炮', desc:'' },
  twin:    { name:'双联炮塔', desc:'' },
  torpedo: { name:'鱼雷发射管', desc:'' },
  bomb:    { name:'臼炮', desc:'' },
  cannon:  { name:'主炮', desc:'' },
  missile: { name:'导弹发射器', desc:'' },
  oerlikon:{ name:'20mm 厄利孔机炮', desc:'' },
  bofors:  { name:'40mm 博福斯高射炮', desc:'' },
  pompom:  { name:'2磅砰砰炮', desc:'' },
  ciws:    { name:'密集阵近防炮', desc:'' },
  sam:     { name:'防空导弹发射器', desc:'' },
  fiveinch:{ name:'5英寸/38 两用炮', desc:'' },
  sixinch: { name:'6英寸巡洋舰炮', desc:'' },
  eightin: { name:'8英寸重巡炮', desc:'' },
  sixteen: { name:'16英寸 Mk7 主炮', desc:'' },
  quadtorp:{ name:'五联装鱼雷', desc:'' },
  m2:      { name:'M2 勃朗宁机枪', desc:'' },
  m777:    { name:'M777 榴弹炮', desc:'' },
  patriot: { name:'爱国者防空导弹', desc:'' },
  tomahawk:{ name:'战斧导弹发射器', desc:'' },
};

// ---------- 飞机 ----------
const PLANES_ZH = {
  f47:  { name:'F-47', desc:'第六代制空战斗机。天上没有比它更快的，也没有比它更早看见你的。' },
  j20:  { name:'歼-20 威龙', desc:'带鸭翼的远程隐身战斗机——为了飞到远海之外先手出击而生。' },
  j35a: { name:'歼-35A', desc:'双发隐身战斗机，尺寸按舰载来的——比大块头转得更紧，隐身一样好。' },
  su57: { name:'苏-57 重罪犯', desc:'带推力矢量的隐身战斗机。这个体格能做出的动作有点不讲道理。' },
  b21:  { name:'B-21 突袭者', desc:'飞翼隐身轰炸机。一门炮都没有——炸弹落地时它本来就不该在附近。' },
  f117: { name:'F-117 夜鹰', desc:'棱面切割的黑色箭头。慢，除了炸弹没别的武器——它靠不被看见活下来。' },
  f15:  { name:'F-15 鹰', desc:'那架从没输过的双垂尾截击机。快、重、挂得多。' },
  eurofighter:{ name:'台风战斗机', desc:'鸭式三角翼，纯为盘旋而生。除了隐身机，没人转得过它。' },
  rafale:{ name:'阵风', desc:'能上舰的全能三角翼——这张表上每件事它都干得不错，而且好看。' },
  gripen:{ name:'JAS 39 鹰狮', desc:'小、便宜、转得像在原地打转。人家本来就是为了在公路上起降设计的。' },
  su34: { name:'苏-34 后卫', desc:'座舱能站直人的装甲战斗轰炸机。别的喷气机扛不住的它扛得住。' },
  su25: { name:'苏-25 蛙足', desc:'装甲对地攻击机——和疣猪是同一个思路的另一面，一样难打下来。' },
  me262:{ name:'Me 262 燕式', desc:'第一架真正上战场的喷气战斗机。甩开所有螺旋桨飞机，也转不过它们任何一架。' },
  mig15:{ name:'米格-15', desc:'裸金属后掠翼战斗机，带一门重炮。爬升快得前所未见。' },
  sabre:{ name:'F-86 佩刀', desc:'米格-15 的对手，射击平台更稳。喷气机狗斗就是这一对打出来的。' },
  f104: { name:'F-104 星战士', desc:'一枚带人的导弹。直线上快得吓人，转弯基本转不动。' },
  a4:   { name:'A-4 天鹰', desc:'小小的舰载轰炸机，外号「小摩托」——便宜、灵活，载弹超出它的身板。' },
  tu160:{ name:'图-160 海盗旗', desc:'史上最大的作战飞机，也是最快的轰炸机。白色、可变后掠翼、巨大。' },
  p47:  { name:'P-47 雷霆', desc:'巨大的星形发动机猛男。八挺机枪，挨的打能把别的飞机直接折了。' },
  hellcat:{ name:'F6F 地狱猫', desc:'扭转太平洋战局的舰载战斗机——好飞，而且专治零式。' },
  fw190:{ name:'福克-沃尔夫 Fw 190', desc:'星形发动机的「屠夫鸟」。横滚比喷火快，打得也狠得多。' },
  il2:  { name:'伊尔-2 强击机', desc:'一架会飞的坦克——装甲直接就是机身的一部分。慢、低、非常难打下来。' },
  dauntless:{ name:'SBD 无畏', desc:'在中途岛五分钟里打断一支舰队的俯冲轰炸机。打孔襟翼、耐心俯冲、一颗重弹。' },
  avenger:{ name:'TBF 复仇者', desc:'又大又慢的单雷舰载轰炸机。真让它对着你的侧舷跑一趟，你会有感觉的。' },
  swordfish:{ name:'剑鱼式', desc:'一架蒙布双翼机，打瘸了俾斯麦。它慢到对空火炮的提前量都往回够不着。' },
  hurricane:{ name:'霍克飓风', desc:'另一架赢下不列颠空战的飞机——射击平台比喷火更稳，也更结实。' },
  e2:   { name:'E-2 鹰眼', desc:'背着雷达罩的舰载预警机。没有武器——它飞起来，是为了让整支舰队都看得见。' },
  p8:   { name:'P-8 海神', desc:'海上巡逻机——找潜艇，然后把鱼雷丢到找着的地方。' },
  osprey:{ name:'V-22 鱼鹰', desc:'倾转旋翼：像直升机那样垂直起飞，然后把发动机转向前，像飞机一样飞。' },
  sr71: { name:'SR-71 黑鸟', desc:'集市蓝图。没有武器，但比追它的一切都快——飞遍战区，把地图照出来。' },
  phantom: { name:'F-4 鬼怪 II', desc:'集市蓝图。又重又吵，什么都能挂。转弯像块砖，打人像卡车。' },
  mosquito: { name:'DH.98 蚊式', desc:'集市蓝图。木头做的轰炸机，比追它的战斗机还快。' },
  mig29: { name:'米格-29 支点', desc:'集市蓝图。个头小、脾气凶的格斗机——甲板上转弯最快的喷气机。' },
  mi28: { name:'米-28 浩劫', desc:'集市蓝图。全天候武装直升机，整机围着装甲设计。' },
  spectre: { name:'AC-130 幽灵炮艇', desc:'集市蓝图。一侧装满火炮的运输机——绕着目标转圈，把它拆了。' },
  su27: { name:'苏-27 侧卫', desc:'集市蓝图。双发大个子制空战斗机：这体格还能拉得动，带追踪导弹。' },
  ka52: { name:'卡-52 短吻鳄', desc:'集市蓝图。共轴双旋翼武装直升机——没有尾桨会被打掉，能原地转圈。' },
  // 上游新增的飞机与无人机
  f14:  { name:'F-14 雄猫', desc:'集市图纸。可变后掠翼舰队截击机,导弹射程远,经典的航母剪影。' },
  harrier: { name:'AV-8B 海鹞II', desc:'集市图纸。短距起降攻击机:不算最快,但在拥挤的航母甲板上特别好用。' },
  mi24: { name:'米-24 雌鹿', desc:'集市图纸。苏联的"飞行步兵战车":比眼镜蛇结实,比堡垒直升机便宜。' },
  chinook: { name:'CH-47 支奴干武装型', desc:'集市图纸。大块头双旋翼运输机改装的耐打火力支援机。' },
  uav:  { name:'RQ-7 侦察无人机', desc:'无武装的第一视角侦察无人机。远距离发现敌人;摔了也没事,你会安全回到船上。' },
  mq9:  { name:'MQ-9 死神', desc:'武装猎杀无人机——遥控追踪打击,能在天上盘旋好几个小时。摔了也没事,驾驶员还在船上呢。' },
  globalhawk: { name:'RQ-4 全球鹰', desc:'无武装的高空侦察机,翼展巨大、航程全场最远——舰队里最好的眼睛,但被抓到就毫无还手之力。' },
  switchblade: { name:'弹簧刀巡飞弹', desc:'小巧的一次性自杀式无人机——便宜、快、有去无回。先侦察,再俯冲撞向目标,临别送上结实一击。' },
  microdrone: { name:'四轴迷你侦察机', desc:'巴掌大的民用风格侦察无人机——超便宜、丢了不心疼,电量刚够翻过地平线偷看一眼。' },
  attackquad: { name:'攻击四轴无人机', desc:'带云台相机的四旋翼攻击无人机——悬停、侦察,往下面丢制导弹药。摔了也没事,遥控驾驶员毫发无伤。' },
  vtolscout: { name:'垂直起降侦察无人机', desc:'双桨垂直起降侦察机,挂着大号光电吊舱——续航长、光学一流,论侦察只输全球鹰。' },
  bayraktar: { name:'旗手 TB2', desc:'集市图纸。便宜的长航时打击无人机:脆、慢,但特别会找目标、点名清除。' },
  predator: { name:'MQ-1 捕食者', desc:'集市图纸。早期武装无人机:便宜的眼睛,外加两发制导打击。' },
  nukedrone: { name:'原子打击无人机', desc:'⚛ 挂着战术核弹头的一次性四轴无人机。飞进敌人舰队俯冲——爆炸把一大片全部夷平。贵得吓人,也彻底有去无回。' },
  fighter:    { name:'战斗机', desc:'又快又灵活。机头有两挺机枪。' },
  divebomber: { name:'俯冲轰炸机', desc:'机枪加重磅炸弹（按 Space 投弹）。' },
  torpbomber: { name:'鱼雷轰炸机', desc:'把鱼雷投在水面上，直奔敌舰。' },
  f22:  { name:'F-22 猛禽', desc:'争夺制空权的隐形战斗机。机炮 + 追踪导弹（Space）。' },
  f18:  { name:'F/A-18 大黄蜂', desc:'航母上的多面手攻击战斗机。机炮 + 炸弹。' },
  a10:  { name:'A-10 疣猪', desc:'坦克克星。机头机炮威力吓人，还带炸弹。' },
  b2:   { name:'B-2 幽灵', desc:'隐形飞翼轰炸机。载弹量超级大。' },
  f35:  { name:'F-35B 闪电', desc:'隐形多面手战机。机炮 + 追踪导弹。' },
  apache:{ name:'AH-64 阿帕奇', desc:'武装直升机——能悬停，链炮加追踪火箭。' },
  cobra: { name:'AH-1 眼镜蛇', desc:'又轻又快的武装直升机。悬停时特别灵活。' },
  p51:  { name:'P-51 野马', desc:'高速螺旋桨战斗机——六挺 .50 机枪，空战高手。' },
  spitfire:{ name:'超级马林喷火', desc:'皇家空军的传奇截击机——转弯超紧的空战好手。' },
  bf109:{ name:'梅塞施密特 Bf 109', desc:'德国空军的主力——速度快，机头炮打得狠。' },
  zero: { name:'三菱零式', desc:'超轻的舰载战斗机——转弯快得惊人，可惜装甲很薄。' },
  p38:  { name:'P-38 闪电', desc:'双尾撑重型战斗机——机头火力集中，还能挂炸弹。' },
  stuka:{ name:'Ju 87 斯图卡', desc:'会尖啸的俯冲轰炸机——一颗重磅炸弹指哪打哪。' },
  corsair:{ name:'F4U 海盗', desc:'弯翅膀的海军战斗轰炸机——机枪 + 炸弹。' },
  b17:  { name:'B-17 空中堡垒', desc:'二战重型轰炸机——浑身自卫机枪，炸弹装得满满的。' },
  lancaster:{ name:'阿弗罗兰开斯特', desc:'皇家空军夜间轰炸机——专扔最重的超级炸弹。' },
  b24:  { name:'B-24 解放者', desc:'四发重型轰炸机，航程远，常规炸弹带得多。' },
  b29:  { name:'B-29“艾诺拉·盖伊”', desc:'历史名机 B-29——只带一颗原子弹，爆炸范围超大，用完就没有了。' },
  b36:  { name:'B-36 和平缔造者', desc:'六台发动机的巨型战略轰炸机——飞得慢但特别结实，常规炸弹装满仓。' },
  tu95v:{ name:'图-95V 熊式——沙皇炸弹', desc:'贵得吓人的改装熊式。带一颗一次性的沙皇炸弹，能抹平整片战场。' },
  halifax:{ name:'汉德利·佩奇哈利法克斯', desc:'四发皇家空军重型轰炸机，自卫火力很强。' },
  pe8:  { name:'佩特利亚科夫 Pe-8', desc:'罕见的苏联重型轰炸机，能挂特别巨大的常规炸弹。' },
  he177:{ name:'亨克尔 He 177 狮鹫', desc:'飞得快的德国重型轰炸机，双联发动机，载弹量大。' },
  tu4:  { name:'图波列夫图-4 公牛', desc:'苏联远程活塞轰炸机，遥控自卫炮塔很厉害。' },
  vulcan:{ name:'阿弗罗火神', desc:'三角翼冷战轰炸机，常规载弹量很大。' },
  tu16: { name:'图波列夫图-16 獾式', desc:'后掠翼苏联喷气轰炸机，带尾炮，常规炸弹装得多。' },
  m4bison:{ name:'米亚西舍夫 M-4 野牛', desc:'巨大的四发苏联战略喷气轰炸机，航程远、防御强。' },
  b58:  { name:'B-58 盗贼', desc:'超音速三角翼轰炸机——飞得飞快，但挂的大家伙少一些。' },
  victor:{ name:'汉德利·佩奇胜利者', desc:'月牙翼的英国 V 式轰炸机——航程出色，弹舱巨大。' },
  f16:  { name:'F-16 战隼', desc:'灵活的多面手喷气机。火神机炮 + 追踪导弹。' },
  b52:  { name:'B-52 同温层堡垒', desc:'战略轰炸机——用超大载弹量地毯式轰炸。' },
  uh60: { name:'UH-60 黑鹰', desc:'通用运输直升机——机身结实，两侧舱门各有一挺机枪。' },
  m27:  { name:'M-27', faction:'麦肯齐第四帝国', desc:'2011 年制空战斗机。两门高速机炮；时速 1,300 英里。' },
  mh221:{ name:'MH-221', faction:'麦肯齐第四帝国', desc:'1980 年截击机，2001 年改到完美。不用子弹，改带一大堆便宜的防空导弹。' },
  m42:  { name:'M-42', faction:'麦肯齐第四帝国', desc:'2027 年双炮制空战斗机；时速 1,500 英里。' },
  mhkl235:{ name:'MHKL-235', faction:'麦肯齐第四帝国', desc:'2018 年搜索歼灭机。机枪很弱，机身加固后成了威力惊人的战时神风撞击机。' },
  amh112:{ name:'AMH-112 巨兽', faction:'麦肯齐第四帝国', desc:'2017 年的飞行驱逐舰：八门机炮、三十枚导弹、装甲超厚，时速 500 英里。' },
  ss17: { name:'SS-17 电弧战斗机', faction:'平克钦共和国', desc:'2052 年战斗机，两门超高速电能机炮，极速 2,000 英里。' },
  p11:  { name:'P-11 隐形轰炸机', faction:'平克钦共和国', desc:'2032 年隐形重型轰炸机。满载时速 1,000 英里，扔空炸弹后能飙到 1,600 英里。' },
  sp9r: { name:'SP-9-R', faction:'平克钦共和国', desc:'1999 年侦察机。双机炮加 2,500 英里时速，可惜油箱特别小。' },
  a251: { name:'A-251', faction:'阿尔西亚联盟', desc:'2025 年战斗机，散射机炮加十五枚导弹。燃料越烧越轻，时速从 1,000 一路飙到 3,000 英里。' },
  ah887:{ name:'AH-887 飞行超级堡垒', faction:'阿尔西亚联盟', desc:'2033 年双发飞行堡垒。三叶主旋翼、80 枚导弹，外加 500 发点射火箭弹。' },
  lfc5: { name:'LFC-5', faction:'阿尔西亚联盟', desc:'2046 年管制级搜索歼灭机，带着十三枚会追踪的核弹头。' },
  chicken3:{ name:'小鸡-3', faction:'遥远之国', desc:'时速 1,600 英里的制空战斗机，装了三门机炮。' },
};

// ---------- 坦克（desc 留空，数据行由代码生成） ----------
const TANKS_ZH = {
  jagdpanther: { name:'猎豹歼击车', desc:'集市蓝图。没有炮塔，却装着岸上最长的炮。' },
  amx13: { name:'AMX-13', desc:'集市蓝图。自动装弹轻坦——一梭子最快，然后要愣很久。' },
  pzh2000: { name:'PzH 2000', desc:'集市蓝图。自行榴弹炮，射程超过岛上任何一门炮。' },
  leclerc: { name:'勒克莱尔', desc:'集市蓝图。自动装弹的主战坦克，快得像侦察车，打起来像重坦。' },
  bmpt: { name:'BMP-T 终结者', desc:'集市蓝图。专门把滩头步兵清干净——一串机炮，不是一发炮弹。' },
  scorpion: { name:'FV101 蝎式', desc:'集市蓝图。能送上岸的最快的车，还特别轻。' },
  strv103: { name:'Strv 103 S 坦克', desc:'集市蓝图。没有炮塔，趴得几乎贴地——用整辆车瞄准，也几乎打不中它。' },
  tos1: { name:'TOS-1A 喷火坦克', desc:'集市蓝图。坦克底盘上架一排重火箭。装填慢，落点上什么都不剩。' },
  prototype: { name:'原型坦克', desc:'' },
  merkava: { name:'梅卡瓦4型', desc:'集市图纸。以生存性为核心的重型主战坦克,正面装甲厚,射击稳定。' },
  maus:    { name:'八号坦克鼠式', desc:'集市图纸。离谱的超重型坦克:装甲和火炮都巨大,就是慢得心疼。' },
  centurion: { name:'百夫长Mk5', desc:'集市图纸。冷战初期的经典:装甲、火炮和可靠性都很均衡。' },
  bmp2:    { name:'BMP-2 步兵战车', desc:'集市图纸。速度快的步兵战车,机关炮射速惊人;皮薄但便宜。' },
  sherman: { name:'M4 谢尔曼', desc:'' },
  t34:     { name:'T-34', desc:'' },
  panzer4: { name:'四号坦克', desc:'' },
  panther: { name:'黑豹', desc:'' },
  tiger:   { name:'虎式', desc:'' },
  is2:     { name:'IS-2 斯大林', desc:'' },
  stuart:  { name:'M3 斯图亚特', desc:'' },
  abrams:  { name:'M1 艾布拉姆斯', desc:'' },
  leopard2:{ name:'豹2', desc:'' },
  challenger2:{ name:'挑战者2', desc:'' },
  t90:     { name:'T-90', desc:'' },
  t14:     { name:'T-14 阿玛塔', desc:'' },
  type99:  { name:'99式', desc:'' },
  k2:      { name:'K2 黑豹', desc:'' },
  priest:  { name:'M7 牧师', desc:'' },
  wespe:   { name:'黄蜂自行火炮', desc:'' },
  m109:    { name:'M109 帕拉丁', desc:'' },
};

// ---------- 随身武器 ----------
const HANDHELD_ZH = {
  m79:     { name:'M79 榴弹发射器', desc:'与其绕过那堵墙，不如把榴弹扔过去。' },
  at4:     { name:'AT4 火箭筒', desc:'一次性火箭，专治装甲。' },
  autoshot:{ name:'AA-12 全自动霰弹枪', desc:'没人能靠近你第二次。' },
  barrett: { name:'M82 巴雷特', desc:'反器材步枪——一枪一个，挡什么穿什么。' },
  minigun: { name:'M134 转管机枪', desc:'六根枪管一起转。按住别松。' },
  pistol:  { name:'M1911 手枪', desc:'标准配发的随身手枪。' },
  deagle:  { name:'沙漠之鹰', desc:'.50 口径手炮——一枪威力巨大，就是打得慢。' },
  mp5:     { name:'MP5 冲锋枪', desc:'射速超快，适合近距离。' },
  ak47:    { name:'AK-47', desc:'全自动突击步枪——皮实又凶狠。' },
  m16:     { name:'M16', desc:'打得准的全自动步枪。' },
  shotgun: { name:'战斗霰弹枪', desc:'一次喷出 8 颗弹丸——近身威力吓人。' },
  sniper:  { name:'狙击步枪', desc:'远距离一枪一个。' },
  lmg:     { name:'M249 轻机枪', desc:'弹链供弹，火力压制。' },
  rpg:     { name:'RPG-7', desc:'火箭筒——爆炸带溅射伤害。' },
};

// ---------- 岛屿建筑 ----------
const STRUCTS_ZH = {
  longtom:   { name:'长汤姆炮台', desc:'集市图纸。超远程岸炮，射程覆盖大半个战区。' },
  redoubt:   { name:'装甲棱堡', desc:'集市图纸。硬化据点，血极厚，谁上岸就打谁。' },
  flaktower: { name:'防空塔', desc:'集市图纸。混凝土高射炮塔——射程是普通高射炮位的两倍，也难打得多。' },
  bastion:   { name:'棱堡炮台', desc:'集市图纸。带装甲的岸防炮——炮弹更重，打得更远。' },
  railgun: { name:'实验电磁炮', desc:'集市图纸。超级炮级别的直射能量火炮,弹药储备极少,但装填更快。' },
  vls:     { name:'宙斯盾垂发导弹阵', desc:'集市图纸。方方正正的导弹发射单元,大幅强化岛屿防空和反舰火力。' },
  command:   { name:'指挥所', desc:'掌控岛屿归属；每座岛只能有一座大型总部' },
  barracks:  { name:'兵营', desc:'最多维持三支守岛步兵小队' },
  tankdepot: { name:'坦克库', desc:'维修坦克，并缓慢补充一辆被毁的守岛坦克' },
  hospital:  { name:'野战医院', desc:'治疗附近的步兵' },
  ammo:      { name:'弹药库', desc:'让附近武器装填更快；被炸毁时会大爆炸' },
  workshop:  { name:'维修车间', desc:'修理附近的坦克和损坏的部件' },
  coastal:   { name:'海岸炮', desc:'重型反舰炮塔，转向比较慢' },
  torpbat:   { name:'鱼雷碉堡', desc:'朝附近水道发射鱼雷' },
  aa:        { name:'防空阵地', desc:'速射高射炮，专打低空飞机' },
  silo:      { name:'防空导弹阵地', desc:'远程导弹；需要电力和弹药' },
  nukesilo:  { name:'R-36M“撒旦”核弹发射井', desc:'每方限一座 · 战术地图发射 · 200秒装填 · 可被拦截的 9,999 伤害弹头' },
  radar:     { name:'雷达站', desc:'扩大侦测范围，还能给远程火炮指示目标' },
  sonar:     { name:'声呐站', desc:'照出附近的潜艇和水雷' },
  searchlight:{ name:'探照灯塔', desc:'夜里照出附近的敌人，还能帮防空炮瞄准' },
  bunker:    { name:'混凝土碉堡', desc:'装甲机枪火力点，保护步兵' },
  airstrip:  { name:'岛屿机场', desc:'给小型飞机加油、维修、补充弹药' },
  helipad:   { name:'直升机坪', desc:'直升机的快速维修补给点' },
  dock:      { name:'登陆码头', desc:'修理并补给靠岸的友军舰船' },
  fuel:      { name:'燃料库', desc:'加快车辆和飞机的保养；特别容易爆炸' },
  power:     { name:'发电站', desc:'给雷达、声呐、防空导弹和后勤建筑供电' },
  bridge:    { name:'加固桥梁', desc:'巨大的装甲通道，地面战的必争之地' },
  artillery: { name:'重型榴弹炮', desc:'打得又准又远的曲射火炮' },
  rocket:    { name:'火箭炮阵地', desc:'不太准的远程火力覆盖' },
  fortress:  { name:'海防要塞炮塔', desc:'嵌进混凝土里的战列舰炮塔' },
  supergun:  { name:'超重型列车炮', desc:'能打遍全图的巨炮；炮弹有限，装填 32 秒并有警报' },
  tesla:     { name:'特斯拉线圈', desc:'连锁闪电，专打靠近的小艇和飞机' },
  wall:      { name:'海墙', desc:'巨大的装甲屏障，保护附近的建筑' },
};

// ---------- 海港升级 ----------
const HARBOR_UP_ZH = {
  coastal:  { name:'海岸炮群', desc:'给你的海港加装 2 门岸防炮' },
  aa:       { name:'防空炮塔', desc:'加装 2 门高射炮，专撕飞机' },
  missiles: { name:'导弹阵地', desc:'海港会朝敌舰和飞机发射追踪导弹' },
  walls:    { name:'海港城墙', desc:'+1500 最大 HP，装甲更硬（每级 −12% 伤害）' },
  fastBuild:{ name:'加速建造', desc:'舰队增援每级快 60% 抵达' },
  discount: { name:'装备打折', desc:'军械库、机库和坦克价格每级 −10%' },
  slots:    { name:'舰队增援', desc:'战舰每级快 35% 抵达——舰队数量没有上限' },
  income:   { name:'资源仓库', desc:'被动收入（每级 +5/秒）' },
  repair:   { name:'维修船坞', desc:'自动修理海港附近的你方舰船' },
  radar:    { name:'雷达塔', desc:'舰队交战距离每级 +60，还提升瞄准辅助' },
  hangar:   { name:'飞机库', desc:'每级 +2 个机位，起飞和补给更快' },
};
const HARBOR_PATH_ZH = {
  'Defense':'防御', 'Production':'生产', 'Support':'支援',
  '🏗️ Defense':'🏗️ 防御', '⚙️ Production':'⚙️ 生产', '🔧 Support':'🔧 支援',
};

// ---------- 战役（31 个战区，按下标对齐 CAMPAIGN) ----------
const CAMPAIGN_ZH = [
  { name:'训练湾',       theme:'在浅滩里快速练练手，几乎没有抵抗。' },
  { name:'大登陆',       theme:'纯陆战——没有敌方舰队。把坦克开上海滩，拿下每一座岛。' },
  { name:'海岸遭遇战',   theme:'在狭窄水域里的一场短促硬仗。' },
  { name:'南港浅滩',     theme:'家门口的海域——风平浪静，正好带新舰队见见世面。' },
  { name:'破碎礁',       theme:'密密麻麻的群岛。一座岛一座岛地打，非常残酷。' },
  { name:'铁海峡',       theme:'狭窄、被风暴抽打的水道。无处可逃。' },
  { name:'夜幕航道',     theme:'一场在黑暗中边追边打的战斗。' },
  { name:'迷雾边境',     theme:'传感器全瞎了。雷达和声呐就是一切。' },
  { name:'利维坦之墓',   theme:'敌人的旗舰船厂。把整支舰队都带上。' },
  { name:'黎明巡逻',     theme:'晨光洒在平静的海面上。但平静不了多久。' },
  { name:'死亡走廊',     theme:'寡不敌众——九艘敌舰对你的一小队。' },
  { name:'台风航线',     theme:'永不停歇的风暴。山一样的海浪，看不清的炮口。' },
  { name:'黑水伏击',     theme:'浓得像沥青的大雾里，藏着一艘敌方旗舰。' },
  { name:'跳岛作战',     theme:'更大规模的陆战——八座岛，没有敌方舰队。' },
  { name:'午夜突袭',     theme:'在永恒的黑夜里出击。探照灯和曳光弹满天飞。' },
  { name:'钢铁舰队',     theme:'十一艘敌方战舰从地平线上压过来。' },
  { name:'破碎海岸',     theme:'被撕成上百条水道的巨大礁区。' },
  { name:'冰封海峡',     theme:'冰架边的灰色暮光和刺骨浓雾。' },
  { name:'清算时刻',     theme:'在翻滚的风暴里正面硬刚。' },
  { name:'幽灵舰队',     theme:'寡不敌众、孤立无援，还被雾和黑夜蒙住了眼。' },
  { name:'火山湾',       theme:'火山灰遮住天空的密集火山岛链。' },
  { name:'最后堡垒',     theme:'十座要塞岛等你强攻。装甲部队，马上上岸！' },
  { name:'漫漫长夜',     theme:'一场永远见不到太阳的战争。' },
  { name:'飓风走廊',     theme:'风暴一场接一场，敌人的战线还格外厚。' },
  { name:'双子利维坦',   theme:'敌人把主力战舰全都派了出来。' },
  { name:'熔炉',         theme:'所有难题一起来——大雾、舰队，还有旗舰。' },
  { name:'钢铁之雨',     theme:'十二艘敌舰，天上全是落下来的炮弹。' },
  { name:'无尽地平线',   theme:'广阔无边的战区——驶向炮火的最长航程。' },
  { name:'最终封锁',     theme:'敌人把整支海军都压向你的防线。' },
  { name:'诸神黄昏礁',   theme:'黑夜、风暴，加上敌人的全部舰队。毫不留情。' },
  { name:'最后的浪潮',   theme:'每一门炮。每一艘船。战争在这里终结。' },
];

// ---------- 军衔 ----------
const RANKS_ZH = {
  'Ensign':'少尉',
  'Lieutenant':'上尉',
  'Commander':'中校',
  'Captain':'上校',
  'Commodore':'准将',
  'Rear Admiral':'少将',
  'Vice Admiral':'中将',
  'Admiral':'上将',
  'Fleet Admiral':'海军元帅',
};

// ---------- Claude 小提示（按下标对齐 CLAUDE_TIPS) ----------
const CLAUDE_TIPS_ZH = [
  '按 E 掌舵——W/S 油门，A/D 转舵。',
  '按 Tab 打开军械库，再按 F 就能在你站的位置装上一门炮。',
  '按 H 打开海港升级——维修船坞能救你的命。',
  '把船开到岛边，按 G 上岸。按 B 就能在岛上修防御。',
  '清掉守军、贴近岛屿坚持一会儿就能占领它——岛屿还会扩大你的雷达。',
  '在机库买飞机：按 E 自己开，按 Y 派 AI 飞行员上天。',
  '坦克就停在你的甲板上——按 E 开坦克，按 G 把它送上岛。',
  '注意天气：大雾、风暴和黑夜会让所有人的传感器变短。',
  '在坦克、飞机、炮塔和舵位上按 T 切换第一人称视角。',
  '敌人的利维坦值 $30,000。多叫些帮手再上。',
  '潜艇按 C 下潜——火炮打不到你，但你也只能用鱼雷。',
  '炸沉敌人海港就能赢下战争——但先占岛才能喂饱你的经济。',
];

// ---------- 英文显示名 → 中文 平面映射（供 trName() 使用；运行时有大小写兜底） ----------
// ===== i18n merge supplement — kid-friendly zh for the newly merged English-only systems =====
// ZH_EXACT_KID: exact whole-string prompts (flashPrompt/comms/prompt → trText)
// ZH_PATTERNS_KID: anchored regexes for runtime-concatenated strings (same shape as ZH_PATTERNS)

const ZH_EXACT_KID = {
  // ---- 搁浅警告 ----
  '⚠ HULL GROUNDING — back off the shoreline!': '⚠ 船底擦着海底了——快倒车离开浅滩！',

  // ---- 极端天气 ----
  '⚡ LIGHTNING STRIKE — hull jolted!': '⚡ 被闪电劈中——船身猛地一震！',
  '🌪 TORNADO WARNING — keep ships out of the funnel!': '🌪 龙卷风警报——让战舰离风柱远一点！',
  '🌋 VOLCANIC ERUPTION — burning rock incoming!': '🌋 火山喷发——燃烧的岩石砸过来了！',
  '⛈ SUPERCELL — violent lightning and extreme seas!': '⛈ 超级雷暴——狂雷闪电加滔天巨浪！',
  // 三种新天气名会以 '⛅ Weather: X' 整句出现,精确条目优先于旧模式规则
  '⛅ Weather: VOLCANO': '⛅ 天气：火山',
  '⛅ Weather: TORNADO': '⛅ 天气：龙卷风',
  '⛅ Weather: SUPERCELL': '⛅ 天气：超级雷暴',

  // ---- 天气转变(turnWeather 的四种 label,flashPrompt + comms 两种形态) ----
  '⛅ Weather shifting — skies clearing': '⛅ 天气转变——天要放晴了',
  '⛅ Weather shifting — cloud rolling in': '⛅ 天气转变——乌云压过来了',
  '⛅ Weather shifting — a fog bank closing in': '⛅ 天气转变——大雾正在围上来',
  '⛅ Weather shifting — a storm bearing down': '⛅ 天气转变——风暴正朝我们扑来',
  'Skies clearing — adjust your gunnery.': '天要放晴了——重新校准你的火炮吧。',
  'Cloud rolling in — adjust your gunnery.': '乌云压过来了——重新校准你的火炮吧。',
  'A fog bank closing in — adjust your gunnery.': '大雾围上来了——重新校准你的火炮吧。',
  'A storm bearing down — adjust your gunnery.': '风暴扑过来了——重新校准你的火炮吧。',

  // ---- 动态战场事件 ----
  '📦 Supply drop — salvage crates in the water nearby': '📦 空投补给——附近海面漂着物资箱，快去打捞',
  'Air-dropped supplies near your position — go collect them.': '补给已空投到你附近——快去收下。',
  'New surface contacts bearing from the enemy line.': '敌方战线方向出现新的水面目标。',
  '✖ CONVOY LOST — escort failed.': '✖ 运输船沉了——护航失败。',
  'Cargo run underway — cover me, Admiral!': '运输任务开始——掩护我，将军！',
  'Cargo delivered. Converting to fleet support duty.': '货物送到了。我转为舰队支援任务。',
  'the front': '前线',
  'the forward line': '前线',

  // ---- 强行登舰(接舷战) ----
  'Boarding broken off.': '登舰行动中断了。',
  'Prize crew aboard — captured hull joining the fleet.': '接管小队已登舰——俘获的战舰正式加入舰队。',

  // ---- 无人机(UAV) ----
  'UAVs need your remote pilot — press E to launch.': '无人机需要你远程驾驶——按 E 放飞。',
  // 下面这些短句是 '(msg) — autopilot…' / '(msg) — captain…' 拼接的开头,供模式规则回查
  'UAV recovered': '无人机已回收',
  'UAV recalled': '无人机已召回',
  'UAV destroyed': '无人机被击毁',
  'UAV link ended': '无人机链路已断开',
  'Nuclear strike drone expended': '核打击无人机已完成使命',
  'UAV battery depleted before recovery': '无人机电池没撑到回收就耗尽了',
  'UAV recovered — captain safely back aboard.': '无人机已回收——舰长安全回到舰上。',
  'UAV recalled — autopilot returning to ship.': '无人机已召回——自动驾驶正带它飞回战舰。',
  'UAV recovered — autopilot returning to ship.': '无人机已回收——自动驾驶正带它飞回战舰。',
  '☢ NUCLEAR STRIKE DRONE DETONATED': '☢ 核打击无人机已引爆',
  '🔥 YOUR AIRCRAFT IS ON FIRE — press P to bail out!': '🔥 你的飞机着火了——快按 P 跳伞！',
  'Burning aircraft went down!': '着火的飞机坠毁了！',

  // ---- 坦克涉水 / 卡住 ----
  '🌊 Tank taking water damage — get back to land!': '🌊 坦克泡在水里受损——快开回陆地！',
  'Flooded in deep water!': '在深水里泡坏了！',
  '⛔ Tank blocked by structure': '⛔ 坦克被建筑挡住了',

  // ---- 部位命中(calledShot 的 msg;玩家侧以 '⚠ msg' 出现,由旧 ⚠ 兜底规则回查这里) ----
  '💧 waterline hit — flooding': '💧 打中水线——正在进水',
  '⚙ stern hit — engines crippled': '⚙ 打中船尾——引擎受创',
  '🔫 turret knocked out': '🔫 打哑了一座炮塔',
  '🔥 magazine fire': '🔥 弹药库起火',
  '💥 bow holed — taking water': '💥 船头开了个洞——正在进水',

  // ---- 起火(igniteEntity) ----
  "🔥 FIRE ABOARD — she's burning!": '🔥 舰上起火——船烧起来了！',

  // ---- 拍照模式 / 画质 ----
  '📷 Photo mode — WASD fly · Space/Shift up-down · mouse look · L to exit': '📷 拍照模式——WASD 飞行 · Space/Shift 升降 · 鼠标转视角 · L 退出',
  'Post-processing unavailable in this browser.': '这个浏览器用不了画面特效。',
  '⚙ Performance mode: render detail reduced': '⚙ 性能模式：画面细节已调低',
  '🖼 Graphics: Clean': '🖼 画质：简洁',
  '🖼 Graphics: Bloom': '🖼 画质：泛光',

  // ---- K 键设置面板 ----
  '⚙ SETTINGS': '⚙ 设置',
  'Visual combat feedback is optional. Press <b>K</b> to close.': '战斗画面提示都可以自由开关。按 <b>K</b> 关闭。',
  'Hit marker & kill feed': '命中标记和击杀播报',
  'Floating damage numbers': '飘出的伤害数字',
  'Camera shake': '镜头震动',
  'Hide the \u201cwhat can I do\u201d list': '\u9690\u85cf\u300c\u73b0\u5728\u80fd\u505a\u4ec0\u4e48\u300d\u5217\u8868',
  'Auto takeoff (taxi for me)': '\u81ea\u52a8\u8d77\u98de\uff08\u66ff\u6211\u6ed1\u884c\uff09',
  'Advanced flying (roll all the way over — barrel rolls)': '高级飞行（能一直翻过去——做横滚）',
  'Cinematic look (darker, hazier)': '\u7535\u5f71\u611f\u753b\u9762\uff08\u66f4\u6697\u3001\u6709\u96fe\uff09',
  'Pause the war in the armory': '进军械库时暂停战斗',

  // ---- 联机(MP)状态 ----
  'Connection failed.': '连接失败。',
  'Could not reach that server.': '联系不上那台服务器。',
  'Error.': '出错了。',

  // ---- 致命错误卡片 ----
  '⚠ GAME ERROR': '⚠ 游戏出错了',
  'The battle stopped safely instead of silently freezing. Reload to restart the renderer.': '战斗已经安全停下，而不是悄悄卡死。刷新页面就能重启游戏画面。',
  'RELOAD GAME': '重新加载游戏',
  'Unknown error': '未知错误',

  // ---- 舰队无线电新增台词 ----
  'Captain has bailed out — assuming autonomous combat patrol.': '舰长已跳伞——我来接管飞机，继续自主巡逻作战。',
  'Taking heavy fire — falling back!': '挨了太多炮火——正在撤退！',
  'Aircraft recovering to rearm — back up shortly.': '飞机返场补弹——很快就回来。',

  // ---- 宿敌(NEMESIS)开场狠话与败北台词(comms 原文精确匹配) ----
  'So Southhaven sends a cadet. I will send you home in pieces.': '南港就派来个学员？我会把你打成碎片送回去。',
  'The Wolf... run to ground. Impossible.': '狼……居然被围死了。不可能。',
  'This harbour is mine to starve, Captain. Turn back while you float.': '这座海港归我封锁，舰长。趁你还浮着，赶紧掉头。',
  'The lanes are... open. Kessler will pay for this.': '航线……被打通了。凯斯勒会付出代价的。',
  'Every gun on this reef is ranged on you. By all means — come closer.': '礁上每一门炮都瞄好了你。来呀——再靠近一点。',
  'My batteries... silenced. The reef is lost.': '我的炮群……全哑了。礁堡丢了。',
  'You cannot fight what you cannot see. The dark belongs to me.': '看不见的敌人，你怎么打？黑夜是属于我的。',
  'Even shadows... burn. Varga, forgive me.': '连影子……也会燃烧。瓦尔加，原谅我。',
  'Into the fog, then. They never find the ones I take.': '那就进雾里来吧。被我抓走的船，从来没人找得到。',
  'The fog... clears. You should not have found me.': '雾……散了。你不该找到我的。',
  'You face the LEVIATHAN now, child. Nothing floats that I cannot sink.': '现在你面对的是利维坦，小家伙。海上没有我击沉不了的东西。',
  'The great ship... goes down. But Varga will build more.': '巨舰……沉下去了。但瓦尔加还会造出更多。',
  'The trap sprang the moment you set your heading. Far too late now.': '你定下航向那一刻，陷阱就合上了。现在已经太迟了。',
  'Outfoxed... by a Free Isles dog. Unthinkable.': '居然被自由群岛的家伙……算计了。难以置信。',
  'Eleven hulls answer my flag, and you bring... that? Charge, then.': '十一艘战舰听我号令，而你就带了……这个？那就冲吧。',
  'My armada... a reef of scrap. The war turns here.': '我的无敌舰队……成了一片废铁礁。战局从这里逆转了。',
  'We answer to no radio and fear no death. We are already lost.': '我们不接电台呼叫，也不怕死——因为我们早就沉没过了。',
  'Back... to the deep. Where the lost belong.': '回到……深海去。那才是迷失者的归宿。',
  'The storm is my ally, Admiral. It will drown you long before I must.': '风暴是我的盟友，将军。不用我动手，它就会先淹了你。',
  'Even the hurricane... could not save me from you.': '连飓风……都没能把我从你手里救走。',
  'One Leviathan broke you once. Now face two — and the brothers Vukovic.': '一艘利维坦就曾打垮过你。现在来了两艘——还有武科维奇兄弟。',
  'Brother... they are both gone. It is over.': '兄弟……两艘都没了。结束了。',
  'You will not reach the Marshal. I am the last wall — and I do not fall.': '你到不了元帅面前。我是最后一堵墙——墙是不会倒的。',
  'Forgive me, Marshal... the wall... is broken.': '原谅我，元帅……这堵墙……被打穿了。',
  'So the cadet became an Admiral. Come then — let us end the tide where it began. FIRE!': '当年的小学员，如今成了上将。来吧——让这场怒潮在它开始的地方终结。开火！',
  'A hundred years... undone by a single hull. The tide... is yours.': '一百年的战争……败给了一艘战舰。这片怒潮……归你了。',
  'Varga is gone, but the Dominion is not. Over my sinking deck, Admiral.': '瓦尔加倒了，但多米宁还在。想过去？先从我沉没的甲板上踏过去吧，将军。',
  'The last of us... falls. The Iron Tide is free.': '我们最后一个人……也倒下了。钢铁怒潮的大海，自由了。'
};

const ZH_PATTERNS_KID = (() => {
  const TN = s => (typeof trName === 'function') ? trName(s) : s;
  // 回查:先旧精确表,再本次新增精确表,最后名称兜底
  const RK = s => (typeof ZH_EXACT !== 'undefined' && ZH_EXACT[s]) || ZH_EXACT_KID[s] || TN(s);
  // 宿敌人名与头衔(横幅里以 原样/全大写 两种形态出现)
  const NEM_NAME = {
    'Cmdr. Skarr': '斯卡尔中校', 'Capt. Dross': '德罗斯舰长', 'Gunmaster Holt': '炮术长霍尔特',
    'Nightcaptain Vex': '夜航舰长维克斯', 'Marsh-Capt. Grull': '泽地舰长格鲁尔',
    'Capt. Idris Corvo': '伊德里斯·科尔沃舰长', 'Baron Kessig': '凯西格男爵',
    'Admiral Torvald': '托瓦尔德上将', 'The Revenant': '亡魂船长', 'Stormlord Bane': '风暴领主贝恩',
    'The Vukovic Twins': '武科维奇双子', 'Grand Capt. Mordent': '莫登特大舰长',
    'Grand Marshal Varga': '瓦尔加大元帅', 'Admiral Rook': '鲁克上将'
  };
  const NEM_TITLE = {
    'the Coastal Wolf': '海岸之狼', 'the Blockade-Breaker': '封锁粉碎者', 'the Reefwarden': '守礁人',
    'the Shadow of the Straits': '海峡之影', 'the Fogwolf': '雾中之狼',
    'master of the Leviathan': '利维坦的主人', 'the Ambusher': '伏击大师',
    'lord of the Iron Armada': '钢铁舰队之主', 'captain of the Ghost Fleet': '幽灵舰队船长',
    'who rides the hurricane': '驾驭飓风的人', 'admirals of the Twin Leviathans': '双子利维坦的统帅',
    "Varga's right hand": '瓦尔加的左右手', 'warlord of the Dominion': '多米宁的最高统帅',
    'the Last Loyalist': '最后的忠臣'
  };
  const NEMU = {}; for (const k in NEM_NAME) NEMU[k.toUpperCase()] = NEM_NAME[k];
  const NEM = s => NEM_NAME[s] || NEMU[s] || TN(s);

  return [
    // ---- 无人机 msg+后缀 拼接句(msg 部分回查精确表) ----
    { re: /^([\s\S]+) — autopilot returning to ship\.$/, out: m => RK(m[1]) + '——自动驾驶正带它飞回战舰。' },
    { re: /^([\s\S]+) — captain safely back aboard\.$/, out: m => RK(m[1]) + '——舰长安全回到舰上。' },
    { re: /^Drone bay limit reached \((\d+)\)$/, out: m => '无人机机位满了（上限 ' + m[1] + ' 架）' },

    // ---- 飞机撞岛 / 部件脱落 ----
    { re: /^Flew into (.+) — aircraft destroyed!$/, out: m => '一头撞上' + (m[1] === 'an island' ? '岛屿' : TN(m[1])) + '——飞机报废了！' },
    { re: /^💥 (.+) broke away!$/, out: m => '💥 ' + TN(m[1]) + ' 整个脱落了！' },

    // ---- 强行登舰 ----
    { re: /^⚔ BOARDING (.+) — hold your ground, her crew is fighting back!$/, out: m => '⚔ 正在强行登上' + TN(m[1]) + '——站稳了，敌舰船员在反击！' },
    { re: /^⚔ Her crew fights back! (\d+)% health — (\d+)s to secure the deck$/, out: m => '⚔ 敌舰船员在反击！生命值 ' + m[1] + '%——再撑 ' + m[2] + ' 秒就能拿下甲板' },
    { re: /^⚓ SHIP CAPTURED — (.+) JOINS YOUR FLEET · \+\$750$/, out: m => '⚓ 俘获战舰——' + TN(m[1]) + ' 加入你的舰队 · +$750' },

    // ---- 宿敌横幅(由具体到宽泛) ----
    { re: /^☠ NEMESIS — (.+?), (.+)$/, out: m => '☠ 宿敌现身——' + NEM(m[1]) + '，' + (NEM_TITLE[m[2]] || TN(m[2])) },
    { re: /^☠ (.+) DEFEATED — \$(\d+) BOUNTY$/, out: m => '☠ 击败了' + NEM(m[1]) + '——赏金 $' + m[2] },
    { re: /^☠ (.+) DEFEATED$/, out: m => '☠ 击败了' + NEM(m[1]) },

    // ---- 部位命中提示(msg 部分回查精确表) ----
    { re: /^🎯 Called shot — ([\s\S]+)$/, out: m => '🎯 精准命中——' + RK(m[1]) },

    // ---- 动态战场事件 ----
    { re: /^⚠ Dominion reinforcements — (\d+) hulls? inbound!$/, out: m => '⚠ 多米宁援军——' + m[1] + ' 艘战舰来袭！' },
    { re: /^📦 CONVOY INBOUND — escort (.+) to (.+)$/, out: m => '📦 运输船队来了——护送 ' + m[1] + ' 前往' + (m[2] === 'the forward line' ? '前线' : TN(m[2])) },
    { re: /^(.+) is carrying fuel and ammunition\. Escort it through the combat zone\.$/, out: m => m[1] + ' 装着燃料和弹药。护送它穿过交战区。' },
    { re: /^📦 (.+) DELIVERED — \+\$900, fleet resupplied$/, out: m => '📦 ' + m[1] + ' 送达——+$900，舰队补给完毕' },
    { re: /^ESCORT convoy to (.+)$/, out: m => '护送运输船前往' + (m[1] === 'the front' ? '前线' : TN(m[1])) },

    // ---- 联机加入横幅 ----
    { re: /^🌐 Joined (.+) as ([A-Z]+) — (\d+) other captain\(s\) aboard\.$/, out: m => '🌐 加入了' + (m[1] === 'the server' ? '服务器' : TN(m[1])) + '——你在' + ({ BLUE: '蓝方', RED: '红方' }[m[2]] || m[2]) + '，还有 ' + m[3] + ' 位舰长同场作战。' },

    // ---- 战舰旧伤(带伤复出) ----
    { re: /^⚓ (.+) returns to service still battle-scarred — (\d+)% hull\. Bring her home healthy to repair her reputation\.$/, out: m => '⚓ ' + TN(m[1]) + ' 带着旧伤重新出战——船体 ' + m[2] + '%。这回平平安安开回家，它就能恢复名声。' },

    // ---- 画质 / 音乐 ----
    { re: /^🖼 Graphics: (.+)$/, out: m => '🖼 画质：' + ({ Clean: '简洁', Bloom: '泛光' }[m[1]] || TN(m[1])) },
    { re: /^🎵 Music (ON|OFF)$/, out: m => '🎵 音乐：' + (m[1] === 'ON' ? '开' : '关') },

    // ---- 战役商店(蓝图市场) ----
    { re: /^(.+) is a campaign-market blueprint\. Buy it before battle\.$/, out: m => TN(m[1]) + ' 是战役商店的蓝图。要在开战前先买好。' },
    { re: /^(.+) unlocks after campaign level (\d+)$/, out: m => TN(m[1]) + ' 要打到战役第 ' + m[2] + ' 关才解锁' },
    { re: /^(.+) reaches the marketplace after level (\d+)$/, out: m => TN(m[1]) + ' 要到 ' + m[2] + ' 级才会在商店上架' },
    { re: /^(.+) already owned$/, out: m => TN(m[1]) + ' 已经拥有了' },
    { re: /^Need ◈(\d+) market credits\. You have ◈(\d+)\.$/, out: m => '需要 ◈' + m[1] + ' 商店点数。你现在有 ◈' + m[2] + '。' },
    { re: /^Marketplace blueprint purchased: (.+) · ◈(\d+) left$/, out: m => '买下商店蓝图：' + TN(m[1]) + ' · 还剩 ◈' + m[2] }
  ];
})();
// =====================================================================
//  合并内容中文补翻 —— 宿敌舰长 / 战役市场 / 沙盒地图 / K 设置 / 联机 / 武器角色 / 图鉴与战记
//  (键为 index.html 中的英文原串,精确匹配;接线时经 trText/trName/catTr 同风格查表)
// =====================================================================

// ---------- 宿敌舰长(NEMESIS):显示名 + 台词精确串 ----------
const NEMESIS_ZH = {
  // -- 名字(裸名,供 comms 说话人 / 铭牌 / 击败横幅回查;运行时可大小写兜底) --
  'Cmdr. Skarr':'斯卡尔中校',
  'Capt. Dross':'德罗斯舰长',
  'Gunmaster Holt':'霍尔特炮长',
  'Nightcaptain Vex':'夜航舰长维克斯',
  'Marsh-Capt. Grull':'沼泽舰长格鲁尔',
  'Capt. Idris Corvo':'伊德里斯·科尔沃舰长',
  'Baron Kessig':'凯西格男爵',
  'Admiral Torvald':'托瓦尔德上将',
  'The Revenant':'亡魂',
  'Stormlord Bane':'风暴领主贝恩',
  'The Vukovic Twins':'武科维奇双子',
  'Grand Capt. Mordent':'莫登特大舰长',
  'Grand Marshal Varga':'瓦尔加大元帅',
  'Admiral Rook':'鲁克上将',
  // -- 名号连写('name, title',供 '☠ NEMESIS — name, title' 横幅模式规则回查) --
  'Cmdr. Skarr, the Coastal Wolf':'斯卡尔中校·海岸之狼',
  'Capt. Dross, the Blockade-Breaker':'德罗斯舰长·封锁破坏者',
  'Gunmaster Holt, the Reefwarden':'霍尔特炮长·礁岩守望者',
  'Nightcaptain Vex, the Shadow of the Straits':'夜航舰长维克斯·海峡之影',
  'Marsh-Capt. Grull, the Fogwolf':'沼泽舰长格鲁尔·迷雾之狼',
  'Capt. Idris Corvo, master of the Leviathan':'伊德里斯·科尔沃舰长·利维坦之主',
  'Baron Kessig, the Ambusher':'凯西格男爵·伏击大师',
  'Admiral Torvald, lord of the Iron Armada':'托瓦尔德上将·钢铁舰队之主',
  'The Revenant, captain of the Ghost Fleet':'亡魂·幽灵舰队船长',
  'Stormlord Bane, who rides the hurricane':'风暴领主贝恩·驭飓风者',
  'The Vukovic Twins, admirals of the Twin Leviathans':'武科维奇双子·双子利维坦统帅',
  "Grand Capt. Mordent, Varga's right hand":'莫登特大舰长·瓦尔加的左膀右臂',
  'Grand Marshal Varga, warlord of the Dominion':'瓦尔加大元帅·多米宁战争领主',
  'Admiral Rook, the Last Loyalist':'鲁克上将·最后的忠臣',
  // -- 开场狠话(taunt,comms→trText 精确串) --
  'So Southhaven sends a cadet. I will send you home in pieces.':'南港居然派来个学员？我会把你拆成碎片送回去。',
  'This harbour is mine to starve, Captain. Turn back while you float.':'想让这座海港挨饿，全看我心情，舰长。趁你还浮在水上，赶紧掉头。',
  'Every gun on this reef is ranged on you. By all means — come closer.':'这片礁石上的每一门炮都测好了你的距离。请便——尽管靠过来。',
  'You cannot fight what you cannot see. The dark belongs to me.':'看不见的东西，你打不着。黑暗属于我。',
  'Into the fog, then. They never find the ones I take.':'那就进雾里来吧。被我带走的船，从来没人找得到。',
  'You face the LEVIATHAN now, child. Nothing floats that I cannot sink.':'小家伙，你现在面对的是利维坦。凡是浮在海上的，就没有我击不沉的。',
  'The trap sprang the moment you set your heading. Far too late now.':'你定下航向的那一刻，陷阱就已经合上了。现在后悔太迟啦。',
  'Eleven hulls answer my flag, and you bring... that? Charge, then.':'十一艘战舰听我号令，而你就带来……这个？那就冲锋吧。',
  'We answer to no radio and fear no death. We are already lost.':'我们不听任何电台，也不惧怕死亡。我们本就是被遗弃的亡魂。',
  'The storm is my ally, Admiral. It will drown you long before I must.':'风暴是我的盟友，将军。等不到我动手，它就会先淹没你。',
  'One Leviathan broke you once. Now face two — and the brothers Vukovic.':'一艘利维坦就够你受的了。现在来面对两艘吧——还有我们武科维奇兄弟。',
  'You will not reach the Marshal. I am the last wall — and I do not fall.':'你到不了元帅面前。我就是最后一堵墙——而墙，从不倒下。',
  'So the cadet became an Admiral. Come then — let us end the tide where it began. FIRE!':'当年的学员，如今成了上将。来吧——让这股怒潮在它开始的地方终结。开火！',
  'Varga is gone, but the Dominion is not. Over my sinking deck, Admiral.':'瓦尔加倒下了，但多米宁还在。想过去？先让我的甲板沉了再说，将军。',
  // -- 败亡遗言(defeat,comms→trText 精确串) --
  'The Wolf... run to ground. Impossible.':'海岸之狼……竟被逼上绝路。不可能。',
  'The lanes are... open. Kessler will pay for this.':'航道……被打通了。凯斯勒会为此付出代价。',
  'My batteries... silenced. The reef is lost.':'我的炮群……全哑火了。礁堡守不住了。',
  'Even shadows... burn. Varga, forgive me.':'原来影子……也会燃烧。瓦尔加，原谅我。',
  'The fog... clears. You should not have found me.':'雾……散了。你本不该找到我。',
  'The great ship... goes down. But Varga will build more.':'巨舰……沉下去了。但瓦尔加还会造出更多。',
  'Outfoxed... by a Free Isles dog. Unthinkable.':'竟然被自由群岛的小子……反将一军。难以置信。',
  'My armada... a reef of scrap. The war turns here.':'我的无敌舰队……成了一片废铁礁。战局从此逆转。',
  'Back... to the deep. Where the lost belong.':'回到……深海去。那才是亡魂的归宿。',
  'Even the hurricane... could not save me from you.':'连飓风……都没能把我从你手里救走。',
  'Brother... they are both gone. It is over.':'兄弟……两艘都没了。一切都结束了。',
  'Forgive me, Marshal... the wall... is broken.':'原谅我，元帅……这堵墙……塌了。',
  'A hundred years... undone by a single hull. The tide... is yours.':'一百年的基业……毁在一艘战舰手里。这片怒潮……归你了。',
  'The last of us... falls. The Iron Tide is free.':'我们最后一人……也倒下了。钢铁怒潮自由了。'
};

// ---------- 战役市场(MARKET_CATALOG,键 'cat:id';TAGS 为角标) ----------
const MARKET_ZH = {
  'ship:pt109':    {desc:'PT-109——胶合板船体、两台发动机，外加一股狠劲。集市里最快的船，也是最脆的。'},
  'ship:visby':    {desc:'维斯比级——棱角分明的碳纤维隐身护卫舰：小、快，等你看清它时它已经在开火了。'},
  'ship:typhoon':  {desc:'台风级——史上最大的潜艇。又慢又巨大，别的艇挨一下就沉，它能扛下来。按 C 下潜。'},
  'ship:qelizabeth':{desc:'伊丽莎白女王号——双舰岛超级航母，带滑跃甲板，水面上最宽敞的飞行甲板。'},
  'plane:mosquito':{desc:'DH.98 蚊式——木头做的轰炸机，比追它的战斗机还快。便宜、快，载弹是真的。'},
  'plane:phantom': {desc:'F-4 鬼怪 II——又重又吵，什么都能挂。转弯像块砖，打人像卡车。'},
  'plane:sr71':    {desc:'SR-71 黑鸟——没有武器，但比任何追它的东西都快。飞遍整个战区，把地图全给你照出来。'},
  'tank:amx13':    {desc:'AMX-13——自动装弹的轻坦：一梭子打得比谁都快，然后要愣很久才能再来一轮。'},
  'tank:jagdpanther':{desc:'猎豹歼击车——没有炮塔，却装着岸上最长的炮。用整辆车瞄准，挨上的基本活不了。'},
  'tank:pzh2000':  {desc:'PzH 2000 自行榴弹炮——射程超过岛上任何一门炮，能打自己看不见的目标。'},
  'weapon:mortar': {desc:'甲板迫击炮——便宜、弹道陡，能把炮弹扔到平射炮够不着的掩体后面。'},
  'weapon:beamcannon':{desc:'Mk 12 光束炮——400 米/秒的连续能量束。不用提前量，不用抛物线，指哪打哪。'},
  'gun:m79':       {desc:'M79 榴弹发射器——与其绕过那堵墙，不如把榴弹扔过去。'},
  'struct:redoubt':{desc:'装甲棱堡——硬化据点，血厚得离谱，而且谁上岸它就打谁。'},
  'struct:longtom':{desc:'长汤姆炮台——超远程岸炮，射程能覆盖大半个战区。'},
  'ship:burke':    {desc:'伯克级——最能干的导弹驱逐舰：快、同尺寸里够结实，全身都是炮位。'},
  'ship:grafzeppelin':{desc:'齐柏林伯爵号——那条永远没造完的航母：一整条飞行甲板，舷侧还架着真炮。'},
  'ship:seawolf':  {desc:'海狼号——集市里唯一的潜艇：下潜更深，打得比普通潜艇狠得多。按 C 下潜。'},
  'plane:mig29':   {desc:'米格-29 支点——个头小、脾气凶的格斗机，甲板上转弯最快的喷气机。'},
  'plane:mi28':    {desc:'米-28 浩劫——全天候武装直升机，整机围着装甲设计：它是打算挨揍的那种炮艇。'},
  'plane:spectre': {desc:'AC-130 幽灵炮艇——一侧装满火炮的运输机。又慢又大，绕着目标转圈把它拆了。'},
  'tank:scorpion': {desc:'FV101 蝎式——能送上岸的最快的车，压甲板都压不出印子。'},
  'tank:bmpt':     {desc:'BMP-T 终结者——专门用来把滩头的步兵清干净：不是一发大炮弹，是一串机炮。'},
  'tank:leclerc':  {desc:'勒克莱尔——自动装弹的主战坦克，快得像侦察车，打起来像重坦。'},
  'weapon:flak88': {desc:'88 毫米 Flak 36——那门有名的两用炮：打飞机，也打船。'},
  'weapon:harpoon':{desc:'鱼叉反舰导弹——射程远远超过你甲板上任何一门炮。'},
  'gun:autoshot':  {desc:'AA-12 全自动霰弹枪。没人能靠近你第二次。'},
  'gun:at4':       {desc:'AT4 火箭筒——下船步战用的一次性火箭，专治装甲，不管那装甲装在什么上面。'},
  'struct:flaktower':{desc:'防空塔——混凝土高射炮塔，射程是普通高射炮位的两倍，也难打得多。'},
  'struct:bastion':{desc:'棱堡炮台——带装甲的岸防炮，弹更重、打得更远。'},
  'ship:zumwalt':  {desc:'集市舰船。棱角分明的隐身驱逐舰——同样长度里算轻的，而且整块甲板都用得上。'},
  'ship:kirov':    {desc:'集市舰船。巨大的导弹巡洋舰——炮位比海上任何一条船都多，装甲也扛得住让你一直用。'},
  'plane:su27':    {desc:'苏-27 侧卫——双发大个子制空战斗机，这体格还能拉得动，带追踪导弹。'},
  'plane:ka52':    {desc:'卡-52 短吻鳄——共轴双旋翼武装直升机，没有尾桨可打，能原地转圈。'},
  'tank:strv103':  {desc:'Strv 103 S 坦克——没有炮塔，趴得几乎贴地；用整辆车瞄准，也几乎打不中它。'},
  'tank:tos1':     {desc:'TOS-1A——坦克底盘上架一排重火箭。装填慢，但落点上什么都不剩。'},
  'weapon:katyusha':{desc:'BM-13 火箭炮架——六联齐射，不讲究瞄准，讲究把那一片全覆盖。'},
  'weapon:railmount':{desc:'Mk 9 电磁炮——弹道笔直、初速极快，指哪打哪，就是充能慢。'},
  'gun:barrett':   {desc:'M82 巴雷特——下船步战用的反器材步枪。一枪一个，挡什么穿什么。'},
  'gun:minigun':   {desc:'M134 转管机枪——下船步战用，六根枪管一起转。按住别松。'},
  'ship:fletcher': {desc:'弗莱彻号——身手飞快的历史名舰驱逐舰，甲板炮位特别实用。'},
  'ship:type055':  {desc:'055 型——现代导弹巡洋舰风格的指挥战舰。'},
  'ship:nimitz':   {desc:'尼米兹号——巨型超级航母，玩空中大军就选它。'},
  'plane:mi24':    {desc:'米-24 雌鹿——苏联历史名机，披着装甲的武装直升机。'},
  'plane:chinook': {desc:'CH-47 支奴干武装型——皮实耐打的双旋翼支援直升机。'},
  'plane:bayraktar':{desc:'旗手 TB2——便宜又能一直在天上盘旋的攻击无人机。'},
  'plane:predator':{desc:'MQ-1 捕食者——早期武装无人机，带两发指哪打哪的导弹。'},
  'plane:f14':     {desc:'F-14 雄猫——可变后掠翼的舰队截击机，导弹射程超远。'},
  'plane:harrier': {desc:'AV-8B 鹞式 II——小巧的舰载攻击喷气机。'},
  'tank:centurion':{desc:'百夫长 Mk 5——冷战早期皮实可靠的中型坦克。'},
  'tank:bmp2':     {desc:'BMP-2——跑得飞快的轻装甲战车，机关炮突突个不停。'},
  'tank:merkava':  {desc:'梅卡瓦 IV——开得慢的重型主战坦克，特别扛揍。'},
  'tank:maus':     {desc:'八号坦克鼠式——装甲厚得离谱、炮大得吓人，就是慢得可怜。'},
  'struct:vls':    {desc:'宙斯盾垂发导弹阵地——给占领的岛屿装上强力导弹防御（需要供电）。'},
  'struct:railgun':{desc:'实验型电磁炮——超级巨炮级的岛屿火炮，装填还更快。'},
  TAGS: {
    'SHIP':'战舰', 'HELICOPTER':'直升机', 'DRONE':'无人机', 'JET':'喷气机',
    'TANK':'坦克', 'IFV':'步战车', 'SUPER-HEAVY':'超重型', 'BUILD':'建筑',
    'ROCKET':'火箭炮', 'DECK GUN':'甲板炮', 'SIDEARM':'随身武器',
    'SUBMARINE':'潜艇', 'GUNSHIP':'炮艇机', 'RECON':'侦察',
    'FAST ATTACK':'快艇', 'BOMBER':'轰炸机', 'LIGHT TANK':'轻坦', 'TANK DESTROYER':'歼击车', 'ARTILLERY':'自行火炮'
  }
};

// ---------- 沙盒地图(SANDBOX_MAPS,按英文名回查) ----------
const SANDBOX_ZH = {
  'Training Ground':   {name:'\u8bad\u7ec3\u573a',       theme:'\u5728\u8fd9\u91cc\u628a\u4ec0\u4e48\u90fd\u5b66\u4e00\u904d\uff1a\u5f00\u8239\u3001\u88c5\u70ae\u3001\u5f00\u98de\u673a\u3001\u5f00\u5766\u514b\u3001\u4e0a\u5cb8\u3001\u5efa\u9020\u3002\u8fd9\u91cc\u6ca1\u6709\u4e1c\u897f\u80fd\u771f\u7684\u4f24\u5230\u4f60\u3002'},
  'Southhaven':        {name:'南港',           theme:'老家海港沙盒：海路均衡、基地岛齐全，随便你演练舰队。'},
  '100% Land':         {name:'百分百陆地',     theme:'几乎全是战场、几乎没有海军：巨大的连片陆地，坦克和步兵的天下。'},
  'Omaha Beach':       {name:'奥马哈海滩',     theme:'抢滩沙盒：一整条设防的海岸线，登陆区、碉堡，还有坦克大冲锋。'},
  'Hiroshima':         {name:'广岛',           theme:'城市岛屿的核爆之后：夷平的街区、灰白的海水，还有残酷的近身战斗。'},
  'Chernobyl':         {name:'切尔诺贝利',     theme:'废弃的反应堆禁区：大雾、隔离岛、雷达站，以及缓慢推进的装甲地面战。'},
  'Desert Test Range': {name:'沙漠试验场',     theme:'干燥开阔的试验靶场，散落着几处营地——尽情测试大坦克和飞机吧。'},
  'Volcanic Caldera':  {name:'火山口',         theme:'一圈厚重的岛屿围着中央的死亡地带——要塞火炮的完美舞台。'}
};

// ---------- K 键设置面板(refreshSettings 行标签与开关) ----------
const KPANEL_ZH = {
  'Hit marker & kill feed':'命中标记和击杀播报',
  'Floating damage numbers':'飘出的伤害数字',
  'Camera shake':'镜头震动',
  'Pause the war in the armory':'进军械库时暂停战斗',
  'ON':'开',
  'OFF':'关'
};

// ---------- 联机面板(mpPanel/openMultiplayer/mpRenderPanel)与击杀播报前缀 ----------
const MP_ZH = {
  '🌐 MULTIPLAYER':'🌐 联机对战',
  'CONNECT':'连接',
  'CLOSE':'关闭',
  'Connecting…':'正在连接……',
  'Not connected.':'尚未连接。',
  'Connection failed.':'连接失败。',
  'Could not reach that server.':'联系不上那台服务器。',
  'Error.':'出错了。',
  // 输入框占位文本
  'relay URL':'中继服务器地址',
  'Captain name':'舰长昵称',
  // 参数化提示:原句为 'Connected — '+N+' server(s) online',需在 ZH_PATTERNS 里加规则,
  // 形如 { re:/^Connected — (\d+) server\(s\) online$/, out:m=>'已连接——'+m[1]+' 个服务器在线' }
  'Connected — {n} server(s) online':'已连接——{n} 个服务器在线',
  // showHit 击杀播报行前缀(前缀+目标名,目标名走 trName)
  'HIT · ':'命中 · ',
  'DESTROYED · ':'击毁 · ',
  'CRITICAL HIT · ':'暴击 · ',
  'RAIL STRIKE · ':'电磁炮打击 · ',
  'AIR HIT · ':'对空命中 · ',
  'MISSILE HIT · ':'导弹命中 · '
};

// ---------- 武器角色名(weaponPersonality 的 role 显示名与附加词) ----------
const ROLE_ZH = {
  'Machine gun':'机枪',
  'Anti-air':'防空炮',
  'Autocannon':'机关炮',
  'Naval cannon':'舰炮',
  'Capital battery':'主力舰主炮',
  'Missile':'导弹',
  'Torpedo':'鱼雷',
  'Bomb mortar':'臼炮',
  'Rail strike':'电磁炮打击',
  'Strategic weapon':'战略武器',
  'tracks aircraft':'追踪飞机',
  'homing':'自动追踪',
  'lob':'抛射'
};

// ---------- 舰船图鉴与战争日志(buildAlmanac / showWarLog 界面标签) ----------
const ALMANAC_ZH = {
  '📖 SHIP ALMANAC':'📖 舰船图鉴',
  '⚓ SHIP ALMANAC':'⚓ 舰船图鉴',   // 战报角落的入口按钮变体
  '⚓ WAR LOG':'⚓ 战争日志',
  '📖 WAR LOG':'📖 战争日志',       // 战报角落的入口按钮变体
  'CLOSE':'关闭',
  'CONTINUE':'继续',
  '⚓ LEGENDARY FLAGSHIPS':'⚓ 传奇旗舰',
  'STANDARD FLEET':'常规舰队',
  // 参数化提示:原句为 N+' hulls in commission — browse the fleet',数字在前
  'hulls in commission — browse the fleet':'艘战舰在役——翻翻你的舰队图鉴吧',
  '— Your chronicle is unwritten. Win a theater to begin. —':'——你的战记还是一片空白。打赢一个战区，就开始书写吧。——',
  '— THE END —':'——全剧终——',
  '⚓ CHRONICLE — ':'⚓ 战记——',    // 前缀,后接战区名(战区名走 CAMPAIGN_ZH)
  // 图鉴卡片数据行用词:'Length 112m · Hull 520 HP · 12 mounts · Surface'
  'Length':'全长',
  'Hull':'船体',
  'mounts':'炮位',
  'Flat-top':'平顶船',
  'Submersible':'潜水艇',
  'Surface':'水面舰'
};
const LORE_ZH_INTRO = `人们把这片海叫做"钢铁怒潮"——一百年的战争往海里沉下了太多钢铁,海水都泛着铁锈的颜色。旧日的国家早就沉没了;剩下的只有自由群岛——一片散落的港口,靠着时刻装满炮弹的大炮,守住了自己的自由。如今,多米宁帝国正从赤红的东方汹涌而来,瓦尔加大元帅的黑红战旗所到之处,一座又一座岛屿被吞没。<br><br>南港是最后一座自由的深水良港——就在今天早晨,凯斯勒舰队司令把舰长肩章别在你的外套上,把一艘战舰的钥匙交到你手里。"就一艘船,"她说,"每一支舰队都是这么开始的。开去训练湾,练到炮打得准了再回来。多米宁帝国可不会等你慢慢学。"<br><br>选一艘你的座舰吧,舰长。大潮正在转向——而它,正朝我们扑来。`;
const LORE_ZH_BEATS_A = [
  /* 1 训练湾 */ `炮术训练结束了。现在你的炮弹指哪打哪,你的船员配合得像一个人。凯斯勒司令在防波堤上从头看到尾,眼神里几乎带着赞许。"不错。"她只说了这两个字——随后脸上的暖意一下子消失了。"因为一个小时前,这已经不是演习了。多米宁的陆战队,刚刚踏上了北边的海滩。"`,
  /* 2 大登陆 */ `敌人还没来得及站稳脚跟,你就把他们赶回了浪花里。海滩是你的了,上面扔满了多米宁士兵丢下的装备。可一名被俘的侦察兵喘着粗气,吐出一句警告:这次登陆只是试探。真正的大舰队正在近海集结——而且,已经出发了。`,
  /* 3 海岸遭遇战 */ `地平线上,三艘多米宁战舰烧成了火把——这是你第一场真正的舰队交战,而你赢了。入夜之前,消息传遍了南港的码头:新来的舰长,真能打。凯斯勒给了你一支像样的分舰队,手指在海图上一点:"南港浅滩。他们想把我们堵在港里活活饿死。去,砸开他们的封锁线。"`,
  /* 4 南港浅滩 */ `封锁被砸开了,航线重新畅通;粮食和炮弹又源源不断地运进南港的船舱。可多米宁帝国没有撤退——它在重新布阵。侦察机带回来的照片上,一片插满岸炮的礁石要塞森然耸立。"破碎礁,"凯斯勒低声说,"他们把一片沉船残骸,改造成了一座堡垒。"`,
  /* 5 破碎礁 */ `你顶着暴风雨般的岸炮火力,在沉船之间穿针引线,让每一座炮台都哑了火。打捞队已经动手拆卸多米宁的大炮,搜刮废钢和秘密——而就在残骸中间,他们找到了几张海图,上面标着一条叫"铁海峡"的水道。那是整片群岛的咽喉。谁掌握它,谁就掌握这片海。`,
  /* 6 铁海峡 */ `铁海峡是你的了。自由群岛第一次守住的海域,比丢掉的还多。瓦尔加的回应通过无线电传来,不加密,专门说给你一个人听:"好好享受白天吧,舰长。我的舰队,最擅长在黑暗里行动。"当天夜里,地平线上的航行灯,一盏接一盏地熄灭了。`,
  /* 7 夜幕航道 */ `你摸着黑跟他们打——靠炮口的火光,靠雷达上的鬼影——最后穿过整片黑暗,船还稳稳浮在海面上。于是多米宁帝国用黑夜换来了更糟的东西:一堵灰色的雾墙从迷雾边境滚滚压来,雾里,有个非常庞大的东西正在移动。`,
  /* 8 迷雾边境 */ `你一炮接一炮,把多米宁的迷雾分舰队硬从雾里拖了出来,直到最后一艘降下军旗。在一间进水的船舱里,你的登舰小队发现每一份命令上都反复出现同一个词——"利维坦"。那不是一个舰级,而是一艘船:多米宁的第一艘无畏巨舰,大到能搅出自己的风暴。它就等在那片深水里,你的海图上只写着一个名字——利维坦之墓。`,
  /* 9 利维坦之墓 */ `利维坦沉了。这一仗几乎耗光了你的全部家底,还倒赔了半条命,但多米宁的旗舰,终于躺在了这片以墓地命名的海底。南港狂欢了一整夜。凯斯勒没有。"一艘利维坦而已,"她轻声说着,展开一张大得多的地图,"瓦尔加有一座专门造它们的船厂。而且现在,他记住你的名字了。"`,
  /* 10 黎明巡逻 */ `天刚亮,你就把战火烧向了东方。这次黎明巡逻本该悄无声息——只是越过边界,去多米宁的海域看一眼。结果一点也不安静。但你冲散了敌人的警戒线,并且在整整一代人以来头一回,把自由群岛的旗帜插上了对岸。反攻,开始了。`,
  /* 11 死亡走廊 */ `他们把你逼进两座要塞海角之间的绞杀场,一艘又一艘战舰堵在你的航线上。你硬闯了这条死亡走廊,从另一头杀了出来——引擎冒着烟,弹药库几乎见了底,但你冲过来了。多米宁的内层防线裂开了,前方是一片开阔的海。至少,眼下是。`,
  /* 12 台风航线 */ `他们一头扎进台风的血盆大口,笃定你不敢跟。你跟了。一边跟大海搏斗,一边跟敌人开炮,风暴没干掉的,都被你送进了海底。在尖啸的狂风里,无线电中传来瓦尔加劈啪作响的声音——这一次,不再是嘲讽:"你不该这么快,就打到这里。"`,
  /* 13 黑水伏击 */ `那本是一个完美的陷阱:整整一支分舰队外加一艘旗舰,藏在漆黑的水域里,在最刁钻的时机猛然收网。它本该成功。可你把这场伏击整个翻了过来,让设陷阱的人自己掉进了陷阱。多米宁帝国不再耍聪明了——它开始拼命堆数量。`,
  /* 14 跳岛作战 */ `一座岛接一座岛,一片滩头接一片滩头,你夺回了多米宁占领多年的整条岛链。这活儿又慢、又苦、全是贴身近战——但你竖起的每一座指挥所都飘着你的旗帜,每一座都是抵在瓦尔加补给线上的一把尖刀。这些曾被占领的岛屿,正在变成一条新的战线。`,
  /* 15 午夜突袭 */ `你挑了月亮还没升起、夜最黑的那一刻,突袭了他们的前进锚地;警报还没响完,你已经消失在夜色里。补给站被炸上了天,他们一半的燃料储备烧了个精光。加不上油的舰队跑不起来——瓦尔加的舰队,开始一瘸一拐了。他下令:剩下的每一艘船,全部集结。`,
  /* 16 钢铁舰队 */ `十一艘多米宁战舰一字排开——这就是"钢铁舰队",奉命一击把你彻底了结。你迎头撞了上去,只给大海留下一片漂浮的残骸。如今南港的码头上,人们开始公开议论:这场战争,真的有可能打赢。而凯斯勒也头一次用起了一个她从前绝不允许自己说出口的词:胜利。`,
];
const LORE_ZH_BEATS_B = [
  /* 17 破碎海岸 */   `多米宁舰队一头扎进破碎海岸的迷宫——上千条水道，上千个死胡同——指望让你在礁石堆里慢慢流血。结果你一条水道一条水道地把他们揪了出来。这片海里再没有能藏身的地方，他们只好掉头向北，逃进了冰海。`,
  /* 18 冰封海峡 */   `你追着他们钻进冰架外的刺骨浓雾。在那里，大海本身就想要你的命，敌人只能算水里第二危险的东西。你带着一身冻伤杀了出来——而且赢了。冰层的另一边，就是多米宁帝国自己的海岸线。战火，眼看就要烧到他们家门口。`,
  /* 19 清算时刻 */   `没有雾，没有冰，也没有花招——就是两支舰队在开阔海面上，按最老的规矩把账算清。这就是清算时刻。硝烟散尽时，自由群岛的军旗还在桅杆上飘。瓦尔加的正规海军打光了。可水手们悄悄传：剩下的更吓人——是那些再也不回应无线电的船。`,
  /* 20 幽灵舰队 */   `寡不敌众、孤立无援，还被人满海追着打——你迎战的，是多米宁早就从名册上划掉、当作沉了的那些船：幽灵舰队，船员全是再没什么可失去的人。那是整场战争里最难打的一仗。你还浮在海面上；他们没有。而前方，天空渐渐变成了灰烬的颜色。`,
  /* 21 火山湾 */     `火山灰从天上往下落，海湾被底下的岩浆映得通红——就在这里，你烧掉了多米宁最后的本土舰队。火山的红光把下一个目标照成了清清楚楚的黑影：瓦尔加的要塞之岛“最后堡垒”，城墙上密密麻麻，架满了他剩下的每一门炮。`,
  /* 22 最后堡垒 */   `你顶着要塞的炮口把陆战队送上了岸，一堵墙一堵墙、一间屋一间屋地拿下了最后堡垒。瓦尔加的旗从城堡顶上降了下来。可他本人不见了——趁着黑夜，登上一艘谁也没见过的新船溜进了大海。他最后的电报说：“这不是投降，是一个开始。漫漫长夜就要来了，将军。”`,
  /* 23 漫漫长夜 */   `他说的还真不是比喻。多米宁手里还剩最后一张牌——足以遮住太阳的浓烟和火山灰，好在无尽的黑暗里，打一场他们一直想打的战争。你在这个不会天亮的黑夜里打赢了头一仗，证明你同样不需要太阳。可漫漫长夜，还一直铺到地平线的那一头。`,
  /* 24 飓风走廊 */   `遮天的浓烟养出了没完没了的风暴，瓦尔加偏偏专挑最凶的那条路逃——飓风走廊，一堵接一堵的风暴墙。你一场风暴一场风暴地追，被大海吞掉了赔不起的船，却一次也没让他甩脱。现在他被逼进了死角。而被逼急的人，会造出怪物。`,
  /* 25 双子利维坦 */ `这回不是一艘无畏舰。是两艘。双子利维坦并排冲出风暴，有好一阵子，眼看就是你的末日。结果末日是它们的。两艘，全沉了。多米宁再也造不出更大的家伙了——凯斯勒司令却警告说，他们还剩最后一招：把手里的一切，一次性全压上来。`,
  /* 26 熔炉 */       `大雾、舰队、旗舰，一股脑全砸向你，一场磨得看不到头的鏖战——熔炉，就是要把你的海军熔成一滩铁水。你顶住了。差一点点没顶住，但你顶住了。熔炉的另一头，多米宁最后的舰队正在后撤，做最后一次集结。战争快打完了。你的弹药也快打完了。`,
  /* 27 钢铁之雨 */   `十二艘敌舰，炮弹密得遮住了天，水兵们管它叫钢铁之雨。你一头驶了进去，又从另一头驶了出来。作为一支能打仗的力量，多米宁海军已经不存在了——只剩一些碎片，朝着海图的边缘、朝着边缘之外的大洋没命地逃。`,
  /* 28 无尽地平线 */ `你把最后几艘逃船一路追到海图的尽头，穿过自由群岛的军舰从没去过的海域——无尽地平线。你在那里追上了他们，做了个了断。现在前方只剩瓦尔加本人——他正把还浮得起来的每一艘船都拢到一起，给自己的退路摆下最后一道封锁线。`,
  /* 29 最终封锁 */   `多米宁幸存的全部海军，被锁成一堵最后的高墙，横在你和瓦尔加的旗舰之间。你把它砸穿了。封锁线成了一堆废铁，航路敞开，整场战争只剩最后一战。瓦尔加自己也清楚。他发来信号：“来诸神黄昏礁吧，将军。让这场大潮，在它涨起的地方落下。”`,
  /* 30 诸神黄昏礁 */ `黑夜、风暴，还有多米宁最后一艘利维坦——就在这片礁石上，当年这场百年战争的第一炮正是在这里打响。你和瓦尔加大元帅舰对舰正面相撞，把他的旗舰送进了海底，和其他所有沉船作伴。多米宁帝国垮了。可有一艘小小的救生艇溜进了黑暗——而大海，实在太宽了。`,
  /* 31 最后的浪潮 */ `一切在这里终结——最后的顽抗，最后的火炮，一场百年战争的最后一波浪潮。当海面终于安静下来，从南港到无尽地平线，每一座岛上飘扬的都是你的旗。凯斯勒司令在舰桥上找到了你——你正望着一片没有在燃烧的大海，活着的人里谁都没见过这样的景象。“人们叫它钢铁怒潮，因为它带来的从来只有钢铁和落水的人，”她说，“而你，还给了它别的东西。”你身后，太阳正从自由的海面上升起。战争结束了。是你赢的。`,
];
const LORE_ZH_BEATS=[...LORE_ZH_BEATS_A,...LORE_ZH_BEATS_B];

const NAME_ZH = {

  // 集市物品名(战役选择界面的集市卡片)
  'PT-109 Torpedo Boat':'PT-109 鱼雷艇', 'HSwMS Visby':'维斯比级', 'Typhoon-class':'台风级', 'HMS Queen Elizabeth':'伊丽莎白女王号',
  'Market Motor Torpedo Boat':'集市鱼雷快艇', 'Market Stealth Corvette':'集市隐身护卫舰', 'Market Ballistic Submarine':'集市弹道导弹潜艇', 'Market Modern Carrier':'集市现代航母',
  // 这八架无人机的名字一直没进 NAME_ZH（先于本次改动就缺）
  'RQ-7 Scout UAV':'RQ-7 侦察无人机', 'MQ-9 Reaper':'MQ-9 死神', 'RQ-4 Global Hawk':'RQ-4 全球鹰',
  'Switchblade Loitering Munition':'弹簧刀巡飞弹', 'Quadcopter Mini-Scout':'微型四轴侦察机',
  'Attack Quadcopter':'攻击四轴无人机', 'VTOL Recon Drone':'垂直起降侦察无人机', 'Atomic Strike Drone':'原子打击无人机',
  'F-47':'F-47', 'J-20 Mighty Dragon':'歼-20 威龙', 'J-35A':'歼-35A', 'Su-57 Felon':'苏-57 重罪犯',
  'B-21 Raider':'B-21 突袭者', 'F-117 Nighthawk':'F-117 夜鹰', 'F-15 Eagle':'F-15 鹰',
  'Eurofighter Typhoon':'台风战斗机', 'Dassault Rafale':'阵风', 'Saab JAS 39 Gripen':'JAS 39 鹰狮',
  'Su-34 Fullback':'苏-34 后卫', 'Su-25 Frogfoot':'苏-25 蛙足', 'Me 262 Schwalbe':'Me 262 燕式',
  'MiG-15':'米格-15', 'F-86 Sabre':'F-86 佩刀', 'F-104 Starfighter':'F-104 星战士', 'A-4 Skyhawk':'A-4 天鹰',
  'Tu-160 Blackjack':'图-160 海盗旗', 'P-47 Thunderbolt':'P-47 雷霆', 'F6F Hellcat':'F6F 地狱猫',
  'Focke-Wulf Fw 190':'福克-沃尔夫 Fw 190', 'Il-2 Sturmovik':'伊尔-2 强击机', 'SBD Dauntless':'SBD 无畏',
  'TBF Avenger':'TBF 复仇者', 'Fairey Swordfish':'剑鱼式', 'Hawker Hurricane':'霍克飓风',
  'E-2 Hawkeye':'E-2 鹰眼', 'P-8 Poseidon':'P-8 海神', 'V-22 Osprey':'V-22 鱼鹰',
  'SR-71 Blackbird':'SR-71 黑鸟', 'F-4 Phantom II':'F-4 鬼怪 II', 'DH.98 Mosquito':'DH.98 蚊式',
  'Jagdpanther':'猎豹歼击车', 'AMX-13':'AMX-13', 'PzH 2000':'PzH 2000',
  'Deck Mortar':'甲板迫击炮', 'Mk 12 Beam Cannon':'Mk 12 光束炮', 'M79 Grenade Launcher':'M79 榴弹发射器',
  'Long Tom Battery':'长汤姆炮台', 'Armoured Redoubt':'装甲棱堡',
  'USS Arleigh Burke':'伯克级', 'Graf Zeppelin':'齐柏林伯爵号', 'USS Seawolf':'海狼号',
  'Market Guided-Missile Destroyer':'集市导弹驱逐舰', 'Market Fleet Carrier':'集市舰队航母', 'Market Attack Submarine':'集市攻击潜艇',
  'MiG-29 Fulcrum':'米格-29 支点', 'Mi-28 Havoc':'米-28 浩劫', 'AC-130 Spectre':'AC-130 幽灵炮艇',
  'Leclerc':'勒克莱尔', 'BMP-T Terminator':'BMP-T 终结者', 'FV101 Scorpion':'FV101 蝎式',
  '88mm Flak 36':'88 毫米 Flak 36', 'Harpoon SSM':'鱼叉反舰导弹',
  'AT4 Launcher':'AT4 火箭筒', 'AA-12 Auto Shotgun':'AA-12 全自动霰弹枪',
  'Flak Tower':'防空塔', 'Bastion Gun':'棱堡炮台',
  'USS Zumwalt':'朱姆沃尔特号', 'Kirov Battlecruiser':'基洛夫号',
  'Market Stealth Destroyer':'集市隐身驱逐舰', 'Market Battlecruiser':'集市战列巡洋舰',
  'Su-27 Flanker':'苏-27 侧卫', 'Ka-52 Alligator':'卡-52 短吻鳄',
  'Strv 103 S-Tank':'Strv 103 S 坦克', 'TOS-1A Solntsepyok':'TOS-1A 喷火坦克',
  'BM-13 Rocket Rack':'BM-13 火箭炮架', 'Mk 9 Rail Cannon':'Mk 9 电磁炮',
  'M82 Barrett':'M82 巴雷特', 'M134 Minigun':'M134 转管机枪',
  // ...and the ten that were already in the market untranslated before these were added
  'Mi-24 Hind':'米-24 雌鹿', 'CH-47 Chinook Gunship':'CH-47 支奴干武装型',
  'Bayraktar TB2':'旗手 TB2', 'MQ-1 Predator':'MQ-1 捕食者',
  'F-14 Tomcat':'F-14 雄猫', 'AV-8B Harrier II':'AV-8B 鹞式 II',
  'Centurion Mk 5':'百夫长 Mk 5', 'BMP-2 IFV':'BMP-2 步战车',
  'Merkava IV':'梅卡瓦 IV', 'Panzer VIII Maus':'八号坦克「鼠」',
  'Experimental Railgun':'实验电磁炮',
  'Aegis VLS Battery':'宙斯盾垂发导弹阵',
  // 上游新增的传奇旗舰(真实历史名舰,用通行中文舰名)
  'Missile Frigate':'导弹护卫舰',
  'Missile Cruiser':'导弹巡洋舰',
  'Guided-Missile Ship':'导弹舰',
  'Kh-35 Sea Skimmer':'Kh-35 掠海导弹',
  'Pincurchin':'海胆号',
  'Republic Plasma Battleship':'共和国等离子战列舰',
  'Plasma Minigun':'等离子转管炮',
  'Battlecruiser':'战列巡洋舰',
  'Coastal Monitor':'近岸浅水重炮舰',
  'Akagi':'赤城号',
  'USS Fletcher':'弗莱彻号',
  'Type 055':'055型',
  'USS Nimitz':'尼米兹号',
  'Escort':'护航舰',
  'Fast Capital':'快速主力舰',
  'Gun Platform':'炮台舰',
  'Fleet Carrier':'舰队航母',
  'Market Destroyer':'集市驱逐舰',
  'Market Missile Cruiser':'集市导弹巡洋舰',
  'Market Supercarrier':'集市超级航母',
  'Bismarck':'俾斯麦号',
  'USS Enterprise':'企业号',
  'USS Missouri':'密苏里号',
  'USS Iowa':'衣阿华号',
  'USS Arizona':'亚利桑那号',
  'HMS Hood':'胡德号',
  'HMS Dreadnought':'无畏号',
  'HMS Ark Royal':'皇家方舟号',
  'Yamato':'大和号',
  'Musashi':'武藏号',
  'Aurora':'阿芙乐尔号',
  'Richelieu':'黎塞留号',
  'Zhiyuan':'致远号',
  'Dingyuan':'定远号',
  'Liaoning':'辽宁号',
  'Legendary Battleship':'传奇战列舰',
  'Legendary Carrier':'传奇航空母舰',
  'Legendary Battlecruiser':'传奇战列巡洋舰',
  'Legendary Cruiser':'传奇巡洋舰',
  // 宿敌
  'Grand Marshal Varga':'瓦尔加大元帅',
  // 舰船
  'Scout Corvette':'侦察巡逻舰',
  'Attack Submarine':'攻击潜艇',
  'Destroyer':'驱逐舰',
  'Heavy Cruiser':'重巡洋舰',
  'Battleship':'战列舰',
  'Dreadnought':'无畏舰',
  'Leviathan':'利维坦',
  'Aircraft Carrier':'航空母舰',
  'Fleet Tender':'舰队补给舰',
  // 甲板武器
  'Deck Gun':'甲板炮',
  'AA Battery':'防空炮',
  'Twin Turret':'双联炮塔',
  'Torpedo Tube':'鱼雷发射管',
  'Bomb Mortar':'臼炮',
  'Main Battery':'主炮',
  'Missile Launcher':'导弹发射器',
  '20mm Oerlikon':'20mm 厄利孔机炮',
  '40mm Bofors':'40mm 博福斯高射炮',
  '2-pdr Pom-Pom':'2磅砰砰炮',
  'Phalanx CIWS':'密集阵近防炮',
  'SAM Launcher':'防空导弹发射器',
  '5"/38 Dual Gun':'5英寸/38 两用炮',
  '6" Cruiser Gun':'6英寸巡洋舰炮',
  '8" Heavy Cruiser':'8英寸重巡炮',
  '16" Mk 7 Battery':'16英寸 Mk7 主炮',
  'Quint Torpedo':'五联装鱼雷',
  'M2 Browning':'M2 勃朗宁机枪',
  'M777 Howitzer':'M777 榴弹炮',
  'Patriot SAM':'爱国者防空导弹',
  'Tomahawk Launcher':'战斧导弹发射器',
  // NPC 军械名（AI_WEAPS)
  'Heavy Gun':'重炮',
  'Dual Purpose':'两用炮',
  'Torpedoes':'鱼雷',
  'Missiles':'导弹',
  // 飞机
  'Fighter':'战斗机',
  'Dive Bomber':'俯冲轰炸机',
  'Torpedo Bomber':'鱼雷轰炸机',
  'F-22 Raptor':'F-22 猛禽',
  'F/A-18 Hornet':'F/A-18 大黄蜂',
  'A-10 Warthog':'A-10 疣猪',
  'B-2 Spirit':'B-2 幽灵',
  'F-35B Lightning':'F-35B 闪电',
  'AH-64 Apache':'AH-64 阿帕奇',
  'AH-1 Cobra':'AH-1 眼镜蛇',
  'P-51 Mustang':'P-51 野马',
  'Supermarine Spitfire':'超级马林喷火',
  'Messerschmitt Bf 109':'梅塞施密特 Bf 109',
  'Mitsubishi A6M Zero':'三菱零式',
  'P-38 Lightning':'P-38 闪电',
  'Ju 87 Stuka':'Ju 87 斯图卡',
  'F4U Corsair':'F4U 海盗',
  'B-17 Flying Fortress':'B-17 空中堡垒',
  'Avro Lancaster':'阿弗罗兰开斯特',
  'B-24 Liberator':'B-24 解放者',
  'B-29 “Enola Gay”':'B-29“艾诺拉·盖伊”',
  'B-36 Peacemaker':'B-36 和平缔造者',
  'Tu-95V Bear — Tsar Bomba':'图-95V 熊式——沙皇炸弹',
  'Handley Page Halifax':'汉德利·佩奇哈利法克斯',
  'Petlyakov Pe-8':'佩特利亚科夫 Pe-8',
  'Heinkel He 177 Greif':'亨克尔 He 177 狮鹫',
  'Tupolev Tu-4 Bull':'图波列夫图-4 公牛',
  'Avro Vulcan':'阿弗罗火神',
  'Tupolev Tu-16 Badger':'图波列夫图-16 獾式',
  'Myasishchev M-4 Bison':'米亚西舍夫 M-4 野牛',
  'B-58 Hustler':'B-58 盗贼',
  'Handley Page Victor':'汉德利·佩奇胜利者',
  'F-16 Fighting Falcon':'F-16 战隼',
  'B-52 Stratofortress':'B-52 同温层堡垒',
  'UH-60 Black Hawk':'UH-60 黑鹰',
  'M-27':'M-27',
  'MH-221':'MH-221',
  'M-42':'M-42',
  'MHKL-235':'MHKL-235',
  'AMH-112 Juggernaut':'AMH-112 巨兽',
  'SS-17 Arc Fighter':'SS-17 电弧战斗机',
  'P-11 Stealth Bomber':'P-11 隐形轰炸机',
  'SP-9-R':'SP-9-R',
  'A-251':'A-251',
  'AH-887 Flying Superfortress':'AH-887 飞行超级堡垒',
  'LFC-5':'LFC-5',
  'Chicken-3':'小鸡-3',
  // 阵营
  'Mackenzian Empire IV':'麦肯齐第四帝国',
  'Pincurchin Republic':'平克钦共和国',
  'Arcian Union':'阿尔西亚联盟',
  'Distant Country':'遥远之国',
  // 坦克
  'M4 Sherman':'M4 谢尔曼',
  'T-34':'T-34',
  'Panzer IV':'四号坦克',
  'Panther':'黑豹',
  'Tiger I':'虎式',
  'IS-2':'IS-2 斯大林',
  'M3 Stuart':'M3 斯图亚特',
  'M1 Abrams':'M1 艾布拉姆斯',
  'Leopard 2':'豹2',
  'Challenger 2':'挑战者2',
  'T-90':'T-90',
  'T-14 Armata':'T-14 阿玛塔',
  'Type 99':'99式',
  'K2 Black Panther':'K2 黑豹',
  'M7 Priest':'M7 牧师',
  'Wespe':'黄蜂自行火炮',
  'M109 Paladin':'M109 帕拉丁',
  // 随身武器
  'M1911 Pistol':'M1911 手枪',
  'Desert Eagle':'沙漠之鹰',
  'MP5 SMG':'MP5 冲锋枪',
  'AK-47':'AK-47',
  'M16':'M16',
  'Combat Shotgun':'战斗霰弹枪',
  'Sniper Rifle':'狙击步枪',
  'M249 LMG':'M249 轻机枪',
  'RPG-7':'RPG-7',
  // 岛屿建筑
  'Command Post':'指挥所',
  'Barracks':'兵营',
  'Tank Depot':'坦克库',
  'Field Hospital':'野战医院',
  'Ammunition Depot':'弹药库',
  'Repair Workshop':'维修车间',
  'Coastal Artillery':'海岸炮',
  'Torpedo Bunker':'鱼雷碉堡',
  'Anti-Air Emplacement':'防空阵地',
  'SAM Site':'防空导弹阵地',
  'R-36M “Satan” Nuclear Silo':'R-36M“撒旦”核弹发射井',
  'Radar Station':'雷达站',
  'Sonar Station':'声呐站',
  'Searchlight Tower':'探照灯塔',
  'Concrete Bunker':'混凝土碉堡',
  'Island Airstrip':'岛屿机场',
  'Helicopter Pad':'直升机坪',
  'Landing Dock':'登陆码头',
  'Fuel Depot':'燃料库',
  'Power Station':'发电站',
  'Fortified Bridge':'加固桥梁',
  'Heavy Howitzer':'重型榴弹炮',
  'Rocket Battery':'火箭炮阵地',
  'Naval Fortress Turret':'海防要塞炮塔',
  'Super-Heavy Railway Gun':'超重型列车炮',
  'Tesla Coil':'特斯拉线圈',
  'Sea Wall':'海墙',
  // 海港升级
  'Coastal Cannons':'海岸炮群',
  'Anti-Air Turrets':'防空炮塔',
  'Missile Battery':'导弹阵地',
  'Harbor Walls':'海港城墙',
  'Faster Construction':'加速建造',
  'Cheaper Equipment':'装备打折',
  'Fleet Reinforcements':'舰队增援',
  'Resource Storage':'资源仓库',
  'Repair Dock':'维修船坞',
  'Radar Tower':'雷达塔',
  'Aircraft Hangar':'飞机库',
  // 基地与大地图岛屿
  'Northwatch':'北望港',
  'Southhaven':'南港',
  'Ironwood':'铁木岛',
  'Stormglass':'风暴镜岛',
  'Redwater':'红水岛',
  'Gannet':'塘鹅岛',
  'Titan’s Reach':'泰坦之臂',
  'Crownland':'王冠地',
  'Whalebone':'鲸骨岛',
  'Long Reef':'长礁',
  'Shatterbank':'碎滩',
  'Mariner’s Rest':'水手歇脚岛',
  // 小型岛屿
  'Skull Reef':'骷髅礁',
  'Far Lantern':'远灯岛',
  'Lowtide':'低潮岛',
  'Pelican':'鹈鹕岛',
  'Broken Mast':'断桅岛',
  // 各战区手工命名岛屿
  'Target Cay':'靶子屿',
  'Gunnery Sandbar':'炮术沙洲',
  'Red Beach':'红滩',
  'Duneside':'沙丘坡',
  'Landing Fields':'登陆场',
  'Tank Plain':'坦克平原',
  'South Approach':'南航道',
  'Supply Bluff':'补给崖',
  'Blackfin':'黑鳍岛',
  'Cutlass Cay':'弯刀屿',
  'Saltspire':'盐尖岩',
  'West Gate':'西门',
  'East Gate':'东门',
  'Narrows West':'窄峡西',
  'Narrows East':'窄峡东',
  'Darkwater':'暗水岛',
  'Lantern Reef':'灯笼礁',
  'Moon Shoal':'月亮浅滩',
  'Black Sand':'黑沙岛',
  'Dawn Point':'黎明角',
  'Blind Reef':'盲礁',
  'Echo Cay':'回声屿',
  'Radar Hill':'雷达山',
  'Greywake':'灰浪岛',
  'Sonar Bank':'声呐滩',
  'Mist Point':'迷雾角',
  'Dry Dock West':'西干船坞',
  'Shipyard East':'东船厂',
  'Graveyard':'沉船墓场',
  'Anchorfall':'落锚地',
  'Scrapyard':'废船场',
  'Wreck Point':'残骸角',
  'Left Battery':'左炮台',
  'Right Battery':'右炮台',
  'Middle Gun':'中央炮位',
  'Last Gun':'最后一炮',
  'Stormwall':'风暴墙',
  'Spray Rock':'浪花岩',
  'Breaker':'碎浪岛',
  'Whitecap':'白浪头',
  'Rain Needle':'雨针岩',
  'Tar Shoal':'沥青浅滩',
  'Ambush Cay':'伏击屿',
  'Blackwater':'黑水岛',
  'Drift Trap':'漂流陷阱',
  'Hidden Reef':'暗礁岛',
  'Fog Hook':'雾钩湾',
  'Beach One':'一号滩',
  'Beach Two':'二号滩',
  'Hill Three':'三号山',
  'Depot Four':'四号仓',
  'Bridge Five':'五号桥',
  'Field Six':'六号场',
  'Seven Palms':'七棕榈岛',
  'Final Cay':'终点屿',
  'Searchlight Point':'探照灯角',
  'Black Pier':'黑码头',
  'Raid Island':'突袭岛',
  'Tracer Key':'曳光屿',
  'Silent Shoal':'寂静浅滩',
  'Shard One':'碎片一号',
  'Shard Two':'碎片二号',
  'Shard Three':'碎片三号',
  'Shard Four':'碎片四号',
  'Broken Bay':'破碎湾',
  'Fracture':'裂缝岛',
  'Splinter':'碎屑岛',
  'Ice Gate West':'冰门西',
  'Ice Gate East':'冰门东',
  'Frost Channel':'霜冻水道',
  'Glacier Tooth':'冰川之牙',
  'Ghost One':'幽灵一号',
  'Ghost Two':'幽灵二号',
  'Phantom Bank':'幻影滩',
  'Wraith Cay':'幽魂屿',
  'Deadlight':'熄灯岛',
  'Ashfall':'落灰岛',
  'Basalt':'玄武岩岛',
  'Volcano Bay':'火山湾',
  'Lava Key':'熔岩屿',
  'Cinder':'火渣岛',
  'Smoke Point':'烟柱角',
  'Obsidian':'黑曜石岛',
  'Hot Spring':'温泉岛',
  'Outer One':'外围一号',
  'Outer Two':'外围二号',
  'Wall Three':'城墙三号',
  'Wall Four':'城墙四号',
  'Bastion Five':'堡垒五号',
  'Bastion Six':'堡垒六号',
  'Gate Seven':'大门七号',
  'Gate Eight':'大门八号',
  'Keep Nine':'主堡九号',
  'Final Keep':'最终主堡',
  'Far West':'极西岛',
  'Far East':'极东岛',
  'Lonely Cay':'孤独屿',
  'Open Reef':'开阔礁',
  'Drifter':'漂泊者岛',
  'Horizon Rock':'地平线岩',
  'Compass':'罗盘岛',
  'Ragnar West':'拉格纳西',
  'Ragnar East':'拉格纳东',
  'Thunder One':'雷霆一号',
  'Thunder Two':'雷霆二号',
  'Fire Reef':'火焰礁',
  'Doom Cay':'末日屿',
  'Last Flame':'最后火焰',
  'Ash Gate':'灰烬之门',
  'Final West':'终局西',
  'Final East':'终局东',
  'Iron Teeth':'铁齿岛',
  'Tide Breaker':'破潮者',
  'Last Harbor':'最后海港',
  'Victory Reef':'胜利礁',
  // 程序生成的陆战地图岛名('Landing Zone '+(i+1),isles 上限 10,预留到 12)
  'Landing Zone':'登陆区',
  'Landing Zone 1':'登陆区 1',
  'Landing Zone 2':'登陆区 2',
  'Landing Zone 3':'登陆区 3',
  'Landing Zone 4':'登陆区 4',
  'Landing Zone 5':'登陆区 5',
  'Landing Zone 6':'登陆区 6',
  'Landing Zone 7':'登陆区 7',
  'Landing Zone 8':'登陆区 8',
  'Landing Zone 9':'登陆区 9',
  'Landing Zone 10':'登陆区 10',
  'Landing Zone 11':'登陆区 11',
  'Landing Zone 12':'登陆区 12',
  // ISLAND_NAMES 兜底名池(buildIsland 未传名时轮换使用)中尚未覆盖的岛名
  'Crown Cay':'王冠屿',
  'Tern Isle':'燕鸥岛',
  'Driftwood':'浮木岛',
  'Northstar':'北极星岛',
  'Cutlass':'弯刀岛',
  'Windscar':'风痕岛',
  'Morrow':'明日岛',
  'Seabreak':'破浪岛',
  'Kingfisher':'翠鸟岛',
  'Rookery':'鸟巢岛',
  'Coral Reach':'珊瑚滩',
  'Widow’s Cape':'寡妇角',
  'Osprey':'鱼鹰岛',
  'Bluewater':'碧水岛',
  'Harpoon':'鱼叉岛',
  'Tempest':'狂风岛',
  'Sable Isle':'黑貂岛',
  // 战区名（供解锁横幅等模式翻译使用）
  'Training Bay':'训练湾',
  'The Landing':'大登陆',
  'Coastal Skirmish':'海岸遭遇战',
  'Southhaven Shoals':'南港浅滩',
  'The Broken Reef':'破碎礁',
  'Iron Straits':'铁海峡',
  'Nightfall Passage':'夜幕航道',
  'Fogbound Marches':'迷雾边境',
  'Leviathan\'s Grave':'利维坦之墓',
  'Dawn Patrol':'黎明巡逻',
  'The Gauntlet':'死亡走廊',
  'Typhoon Run':'台风航线',
  'Blackwater Ambush':'黑水伏击',
  'Island Hopping':'跳岛作战',
  'Midnight Raid':'午夜突袭',
  'The Iron Armada':'钢铁舰队',
  'Shattered Coast':'破碎海岸',
  'Frozen Straits':'冰封海峡',
  'The Reckoning':'清算时刻',
  'Ghost Fleet':'幽灵舰队',
  'Last Bastion':'最后堡垒',
  'The Long Night':'漫漫长夜',
  'Hurricane Alley':'飓风走廊',
  'Twin Leviathans':'双子利维坦',
  'The Crucible':'熔炉',
  'Steel Rain':'钢铁之雨',
  'Endless Horizon':'无尽地平线',
  'The Final Blockade':'最终封锁',
  'Ragnarök Reef':'诸神黄昏礁',
  'The Last Tide':'最后的浪潮',
  // 天气（代码里以大写出现在提示中）
  'CLEAR':'晴朗',
  'STORM':'风暴',
  'FOG':'大雾',
  'OVERCAST':'阴天',
  // 坦克部件
  'Left track':'左履带',
  'Right track':'右履带',
  'Engine':'发动机',
  'Transmission':'变速箱',
  'Turret ring':'炮塔座圈',
  'Gun barrel':'炮管',
  'Breech':'炮闩',
  'Optics':'观瞄镜',
  'Ammo rack':'弹药架',
  'Fuel tank':'油箱',
  'Driver':'驾驶员',
  'Gunner':'炮手',
  'Loader':'装填手',
  'Commander':'指挥官',
  // 飞机部件
  'Left wing':'左机翼',
  'Right wing':'右机翼',
  'Left engine':'左发动机',   // partLabel() 对双发飞机的 engL 会返回 'Left engine'
  'Right engine':'右发动机',
  'Tail':'尾翼',
  'Elevators':'升降舵',
  'Ailerons':'副翼',
  'Weapons':'武器系统',
  'Landing gear':'起落架',
  'Rotor':'旋翼',
  // 部件状态
  'damaged':'受损',
  'CRITICAL':'严重受损',
  'DESTROYED':'已摧毁',
  // 舰队命令
  'ALL SHIPS ATTACK':'全体舰船进攻',
  'CAPTURE ISLANDS':'夺取岛屿',
  'REGROUP ON FLAGSHIP':'向旗舰集结',
  // 支线目标
  'BONUS: sink 3 warships':'奖励：击沉 3 艘战舰',
  'BONUS: down 3 aircraft':'奖励：击落 3 架飞机',
  'BONUS: capture an island':'奖励：占领一座岛屿',
  // 军衔（Commander 键被坦克车长占用，军衔请优先查 RANKS_ZH)
  'Ensign':'少尉',
  'Lieutenant':'上尉',
  'Captain':'上校',
  'Commodore':'准将',
  'Rear Admiral':'少将',
  'Vice Admiral':'中将',
  'Admiral':'上将',
  'Fleet Admiral':'海军元帅',
};

// Iron Tide 中文提示词典 — 供 trText() 边界翻译使用:ZH_EXACT 精确匹配整句,ZH_PATTERNS 处理运行时拼接的动态句(依赖全局 trName() 翻译名称/状态/天气等)。
const ZH_EXACT = {
  // ---- 资金 / 舰队命令 ----
  'Not enough funds': '资金不足',
  'No warships to command.': '没有可以指挥的战舰。',
  '📻 ORDER: ALL SHIPS ATTACK': '📻 命令：全舰进攻',
  '📻 ORDER: CAPTURE ISLANDS': '📻 命令：夺取岛屿',
  '📻 ORDER: REGROUP ON FLAGSHIP': '📻 命令：向旗舰集结',

  // ---- 打捞 / 水雷 ----
  '📦 Salvaged repair stores — hull restored': '📦 打捞到维修物资——船体已修复',
  '📦 Salvaged aviation supplies': '📦 打捞到航空补给',
  'Mine limit reached (5)': '水雷已达上限（5 颗）',
  '⚓ Naval mine deployed (5 maximum)': '⚓ 水雷布放完成（最多 5 颗）',

  // ---- 任务 ----
  '✖ Objective failed.': '✖ 任务失败。',
  '💰 SECRET FUNDS: +$10,000': '💰 秘密资金：+$10,000',

  // ---- 视角切换(T 键三元字面量) ----
  'External chase view': '舰外追踪视角',
  'Bridge view': '舰桥视角',
  'First-person view': '第一人称视角',
  'Chase view': '追踪视角',

  // ---- 战舰沉没 / 上下舰 ----
  '⚓ Your ship was sunk while you were away. Return to your harbor and press P for a replacement.': '⚓ 你不在船上时，战舰被击沉了。回到我方海港，按 P 领取新战舰。',
  'Return to your friendly harbor, then press P to request a replacement ship.': '回到我方海港，再按 P 申请新战舰。',
  'P = parachute from aircraft, or request a replacement ship at harbor after yours is sunk.': '按 P：开飞机时跳伞；战舰沉了以后，也能在海港按 P 领新战舰。',
  'No ship on this theater — this is an airborne ground assault. Capture the command posts.': '这个战区没有战舰——这是空降地面突击。去占领各个指挥所吧。',
  'Your ship is gone — return to friendly harbor and press P for a replacement.': '你的战舰没了——回到我方海港，按 P 领取新战舰。',
  'Back aboard.': '回到舰上了。',
  'Walk back to your ship to climb aboard.': '走回战舰旁边才能上舰。',
  'Sail right up alongside an island or harbor, then press G to go ashore.': '把战舰紧紧靠上岛屿或海港，再按 G 上岸。',
  'Ashore! WASD to walk · G to re-board near your ship.': '上岸了！WASD 走动 · 靠近战舰按 G 回船。',

  // ---- 坦克 ----
  'Out of the tank.': '下车了。',
  'Bring the ship alongside an island, then G to put the tank ashore': '把战舰开到岛边，再按 G 送坦克上岸',
  '🪖 Tank ashore — clear the garrison to capture · G to re-embark': '🪖 坦克上岸了——消灭守军就能占领 · G 回船',
  'No extraction ship in this theater — keep the tank ashore and push the assault.': '这个战区没有接应的战舰——让坦克留在岸上，继续冲锋。',
  'Your ship is gone — drive or dismount back to harbor for a replacement.': '你的战舰没了——开着坦克或下车走回海港，领取新战舰。',
  'Tank re-embarked.': '坦克回到甲板上了。',
  'Drive back alongside your ship to re-embark the tank.': '把坦克开回战舰旁边，才能重新上船。',
  '🔥 AMMO RACK HIT — bail out!': '🔥 弹药架中弹——快弃车！',
  '💢 Ricochet!': '💢 跳弹！',
  'Out of range — aim closer': '太远打不到——瞄近一点',
  'Tank destroyed!': '坦克被击毁！',
  'Ammunition cook-off!': '弹药殉爆！',
  'Burned out!': '烧毁了！',

  // ---- 声呐 ----
  '◉ SONAR PING — contacts revealed for 4 seconds': '◉ 声呐脉冲——敌人现形 4 秒',

  // ---- 岛屿建造 ----
  'Go ashore on an island (G) to build defenses': '先按 G 登岛，才能建造防御',
  'Swim to dry land before building defenses': '先游上岸，才能建造防御',
  'Capture this position before building defenses': '先占领这里，才能建造防御',
  'This position is not under friendly control': '这里还不归我方控制',
  'Only one operational R-36M silo is permitted per side': '每一方只能有一座 R-36M 发射井',
  'These enormous structures require a proper island': '这种巨型建筑要建在真正的岛屿上',
  'This island already has a command post': '这座岛已经有指挥所了',
  'Not enough clear ground — move farther from existing buildings': '空地不够——离旁边的建筑远一点',

  // ---- 甲板炮 ----
  'Stand next to a deck gun, then X to scrap it': '站到甲板炮旁边，再按 X 拆掉它',
  'Pick a weapon in the Armory (Tab)': '先在军械库（Tab）里选一件武器',
  'Too close to the edge of the deck': '离甲板边缘太近了',
  'Too close to another gun': '离旁边的炮太近了',

  // ---- E 键交互(三元字面量) ----
  'Get back to your harbor and press P for a replacement ship.': '回到我方海港，按 P 领取新战舰。',
  'Find a friendly tank to crew, or keep pushing the assault.': '找一辆我方坦克开，或者继续进攻。',
  'Press G to re-board your ship.': '按 G 回到你的战舰上。',
  'No deck left to land on — press P to parachute, then reach harbor.': '没有甲板可以降落了——按 P 跳伞，再回海港。',
  'Landing aborted — climb away.': '取消降落——拉起爬升。',
  'Walk up to a tank, turret, or plane to operate it': '走到坦克、炮塔或飞机旁边，才能操作它',

  // ---- 飞机 ----
  'No free flight spot on deck': '甲板上没有空停机位了',
  'Stand on dry friendly ground to call in a tank': '站到我方陆地上，才能呼叫坦克',
  'Too crowded for a tank drop — move a few steps': '这里太挤，坦克放不下——走开几步',
  'No free deck slot — a bigger ship carries more tanks': '甲板没有空位了——更大的战舰能装更多坦克',
  '✈️ Flight deck wrecked — can’t launch until it’s repaired': '✈️ 飞行甲板被炸坏了——修好之前不能起飞',
  'Takeoff roll…': '起飞滑跑中……',
  'Landing — bring it down OVER the ship, or you ditch.': '降落中——一定要降到战舰正上方，不然就会掉进海里。',
  'Recovered safely on deck.': '安全降落在甲板上。',
  'OUT OF FUEL — engine dead! Glide her down.': '燃油用光——发动机停了！慢慢滑翔下去吧。',
  'ENGINE STALL — too steep! Ease off and level out.': '发动机失速——飞得太陡了！放平机身缓一缓。',
  'Engine restarted.': '发动机重新启动了。',
  'Weapons knocked out!': '武器被打坏了！',
  'Airborne — you have control.': '起飞了——飞机交给你了。',
  '☢ TSAR BOMBA RELEASED — CLEAR THE BLAST AREA!': '☢ 沙皇炸弹已投下——快离开爆炸区！',
  '☢ STRATEGIC WEAPON RELEASED — CLEAR THE BLAST AREA!': '☢ 战略武器已投下——快离开爆炸区！',
  'Aircraft lost!': '飞机没了！',
  'Landing gear collapsed on touchdown!': '着陆时起落架折断了！',
  'Kamikaze!': '神风撞击！',
  'Crashed!': '撞上了！',
  'Kamikaze into the harbor!': '神风撞进了海港！',
  'Main rotor failed — going down!': '主旋翼坏了——正在坠落！',
  'Cockpit hit — pilot down!': '座舱中弹——飞行员倒下了！',
  'Your aircraft was shot down!': '你的飞机被击落了！',
  'Ditched in the ocean — aircraft destroyed!': '迫降到海里——飞机报废了！',
  'Crashed into the sea — aircraft destroyed!': '撞进大海——飞机报废了！',
  'Flew into the sea — aircraft destroyed!': '一头扎进大海——飞机报废了！',

  // ---- 损管(舰船部件着火/进水,critMsg 字面量) ----
  'Fighting the fire…': '正在灭火……',
  '🧯 Fire out.': '🧯 火扑灭了。',
  'Fire out.': '火扑灭了。',
  'Flooding slowing…': '进水慢下来了……',
  '💧 Flooding contained.': '💧 进水堵住了。',
  '🔥 FIRE': '🔥 起火了',
  '💧 HULL BREACH — FLOODING': '💧 船体破洞——正在进水',
  '🛞 ENGINE CRIPPLED — crawling': '🛞 引擎重伤——只能慢慢爬',
  '🛞 ENGINE DAMAGED — slowed': '🛞 引擎受损——速度变慢',
  '🔫 TURRET KNOCKED OUT': '🔫 一座炮塔被打哑了',
  '📡 RADAR DOWN': '📡 雷达坏了',
  '✈️ FLIGHT DECK WRECKED': '✈️ 飞行甲板被炸坏了',
  '🛞 ENGINE CRIPPLED': '🛞 引擎重伤',
  '🛞 ENGINE DAMAGED': '🛞 引擎受损',
  '🔥 fire reached the engine!': '🔥 大火烧到了引擎！',
  '🔥 fire reached a magazine!': '🔥 大火烧到了弹药库！',
  '🛞 engine limping': '🛞 引擎勉强能转了',
  '🛞 engine repaired': '🛞 引擎修好了',
  '🔫 turret back online': '🔫 炮塔恢复射击',
  '📡 radar restored': '📡 雷达修好了',
  '✈️ flight deck repaired': '✈️ 飞行甲板修好了',

  // ---- 利维坦 / 跳伞 / 潜艇 / 核武 / 警报 ----
  '⚓ ENEMY LEVIATHAN DESTROYED — $30,000 BOUNTY': '⚓ 击沉敌方利维坦——赏金 $30,000',
  '🪂 Parachute deployed — landed safely.': '🪂 降落伞打开——安全着陆。',
  '🪂 Parachute deployed — splashdown! Swim to land or harbor.': '🪂 降落伞打开——落进海里啦！快游向陆地或海港。',
  'Only submarines can dive (pick the Attack Submarine)': '只有潜艇能下潜（去选攻击潜艇吧）',
  '🌊 DIVE! DIVE! — running silent · torpedoes only': '🌊 下潜！下潜！——静音潜航 · 只能发射鱼雷',
  '⬆ Surfacing — all weapons back online': '⬆ 上浮——所有武器恢复使用',
  '⚠ Out of air — surfacing!': '⚠ 空气用完了——紧急上浮！',
  '☢ R-36M WARHEAD DETONATED': '☢ R-36M 核弹头已引爆',
  '☢ R-36M LAUNCHED — WARHEAD IN FLIGHT': '☢ R-36M 已发射——核弹头飞行中',
  '☢ ENEMY R-36M LAUNCH DETECTED — INTERCEPT IT!': '☢ 发现敌方 R-36M 发射——快拦截！',
  '⚠ SUPER-HEAVY ARTILLERY INBOUND — MOVE!': '⚠ 超重型炮弹来袭——快躲开！',
  '⚠ SAM LAUNCH — BREAK LOCK!': '⚠ 防空导弹来了——快甩掉锁定！',
  'Build an R-36M silo before opening strategic fire': '先建一座 R-36M 发射井，才能发动战略打击',
  'R-36M silo offline — island power required': 'R-36M 发射井断电了——岛上需要发电站',
  'Nuclear targeting prohibited inside a harbor exclusion zone': '海港禁区内不能设为核打击目标',

  // ---- 聊天指令 ----
  'COMMAND: Type /help to list captain commands.': '指挥部：输入 /help 查看舰长指令。',
  'COMMANDS: /status · /map · /shop · /harbor · /sonar · /mine · /damage · /sound · /clear': '指令：/status · /map · /shop · /harbor · /sonar · /mine · /damage · /sound · /clear',
  'COMMAND: Strategic map toggled.': '指挥部：战略地图已切换。',
  'COMMAND: Armory toggled.': '指挥部：军械库已切换。',
  'COMMAND: Harbor command toggled.': '指挥部：海港指挥部已切换。',

  // ---- 重新出击菜单(#menu .sub) ----
  'Pick a replacement. It redeploys from your harbor.': '选一艘替补战舰，它会从我方海港重新出发。',
  'You were killed ashore — choose a replacement ship or redeploy from harbor.': '你在岸上牺牲了——选一艘替补战舰，从海港重新出发。',
  'You were lost with your ship — pick a replacement. It redeploys from your harbor. (The war isn’t over until a harbor falls.)': '你和战舰一起沉入了大海——选一艘替补，它会从我方海港重新出发。（只要海港还在，战争就没有结束。）',
  'Back at harbor — choose your replacement ship. Your last ship is gone for good.': '回到海港了——选择替补战舰。上一艘已经永远回不来了。',
  'The Leviathan was a one-life flagship and cannot be deployed again. Choose another ship.': '利维坦是只有一条命的旗舰，不能再次出战。换一艘战舰吧。',

  // ---- 战争结束语 ----
  'All islands secured — the archipelago is yours!': '所有岛屿都拿下了——整片群岛都是你的！',
  'Enemy harbor destroyed — the coast is yours!': '敌方海港被摧毁——这片海域是你的了！',
  'Your harbor was overrun!': '我们的海港失守了！',

  // ---- 启动报错 ----
  'Could not start the 3D engine — try GitHub Pages or open the file directly.': '3D 引擎启动失败——试试 GitHub Pages，或者直接打开文件。',
  'Three.js failed to load (check connection / use GitHub Pages).': 'Three.js 加载失败（检查网络 / 改用 GitHub Pages）。',

  // ---- 战略地图提示 ----
  'Select a friendly R-36M silo, then select a target area. Press N to close.': '先选择一座我方 R-36M 发射井，再选择目标区域。按 N 关闭。',
  'No friendly R-36M silo exists. Build one on a controlled island.': '我方还没有 R-36M 发射井。先在已控制的岛屿上建造一座。',
  'Selected silo is OFFLINE — build or repair its island power station.': '选中的发射井断电了——建造或修好岛上的发电站。',
  'R-36M READY — click a target area. Harbors and their exclusion zones cannot be targeted.': 'R-36M 准备就绪——点击目标区域。海港和它的禁区不能作为目标。',

  // ---- Claude 舰载 AI 提示 ----
  'Welcome aboard, Captain! Click me anytime for advice.': '欢迎登舰，舰长！随时点我，我来出主意。',
  'Take the helm with E — W/S throttle, A/D rudder.': '按 E 掌舵——W/S 油门，A/D 方向舵。',
  'Press Tab for the Armory, then F to mount a gun right where you stand.': '按 Tab 打开军械库，再按 F，炮就装在你站的地方。',
  'Press H for harbor upgrades — the Repair Dock is a lifesaver.': '按 H 升级海港——维修船坞关键时刻能救命。',
  'Sail beside an island and press G to go ashore. B builds defenses there.': '开到岛边按 G 上岸，再按 B 就能建防御。',
  'Capture islands by clearing their defenders and holding close — they extend your radar.': '清光守军、守在岛边就能占领——岛屿还能扩大你的雷达。',
  'Buy planes in the Hangar: E to fly one yourself, Y to send up an AI pilot.': '去机库买飞机：按 E 自己开，按 Y 派 AI 飞行员上天。',
  'Tanks ride your deck — E to crew one, G to land it on an island.': '坦克就停在甲板上——按 E 上车，按 G 送它登岛。',
  'Watch the weather: fog, storms and night shrink everyone’s sensors.': '留意天气：大雾、风暴和黑夜会让所有人都看不远。',
  'Press T for first-person view in tanks, planes, turrets and at the helm.': '开坦克、飞机、炮塔或掌舵时，按 T 切换第一人称视角。',
  'The enemy Leviathan is worth $30,000. Bring friends.': '敌方利维坦值 $30,000。记得多带帮手。',
  'Submarines dive with C — invisible to guns, but torpedoes only.': '潜艇按 C 下潜——大炮打不到你，但你也只能用鱼雷。',
  'Sinking the enemy harbor wins the war — but islands feed your economy first.': '击沉敌方海港就赢了——不过先占岛赚钱更稳。',
  '⚠ Hull critical, Captain! Run for home — the Repair Dock patches you up.': '⚠ 舰长，船体快撑不住了！快回家——维修船坞能把你修好。',
  '🔥 We’re on fire! It burns down in time — faster near the Repair Dock.': '🔥 我们着火了！火会慢慢熄灭——靠近维修船坞灭得更快。',
  '💧 Taking on water! Stop taking hits and the crew will plug the leak.': '💧 船在进水！别再挨打，船员就能把漏洞堵上。',
  '⛽ Fuel’s low — fly home and press E over the deck to land.': '⛽ 燃油不多了——飞回来，在甲板上方按 E 降落。',
  '🚨 Our harbor is being pounded — get back and defend it!': '🚨 我们的海港正被猛轰——快回去保卫它！',
  'No guns mounted yet! Tab → pick a weapon → F on deck to install it.': '还没装炮呢！Tab → 选武器 → 在甲板上按 F 安装。',

  // ---- 奖励任务标签(整句与去前缀两种形态) ----
  'BONUS: sink 3 warships': '奖励任务：击沉 3 艘战舰',
  'BONUS: down 3 aircraft': '奖励任务：击落 3 架飞机',
  'BONUS: capture an island': '奖励任务：占领一座岛',
  'sink 3 warships': '击沉 3 艘战舰',
  'down 3 aircraft': '击落 3 架飞机',
  'capture an island': '占领一座岛',

  // ---- 舰队无线电(comms 字面量) ----
  'All ships — press the attack!': '全体战舰——发起进攻！',
  'All ships — take the islands!': '全体战舰——夺取岛屿！',
  'All ships — form on me!': '全体战舰——向我集结！',
  '⚠ Taking heavy fire — requesting assistance!': '⚠ 遭到猛烈炮火——请求支援！',
  'On station — moving to take an island.': '已就位——正去夺岛。',
  'Reporting for duty — weapons hot.': '前来报到——武器就绪。',
  'Moving to secure the island.': '正去占领那座岛。',

  // ---- 组合句里的小名词(供模式规则回查) ----
  'the island': '那座岛',
  'the command center': '指挥中心',
  'tank': '坦克'
};

const ZH_PATTERNS = (() => {
  const rules = [];
  // R():先查 ZH_EXACT,再递归尝试各条规则,最后交给 trName() 兜底
  const R = s => {
    if (ZH_EXACT[s]) return ZH_EXACT[s];
    for (const p of rules) { const m = s.match(p.re); if (m) return p.out(m); }
    return trName(s);
  };
  // SUM():部件简报尾巴(如 '  ·  🔧 Left! Engine‼')。代码只取部件名的首个单词
  // (TPART_NAME/PART_NAME 的 .split(' ')[0]),所以先查缩写表,再交 trName() 兜底。
  const ABBR = {
    Left: '左', Right: '右', Engine: '发动机', Transmission: '变速箱', Turret: '炮塔',
    Gun: '炮管', Breech: '炮闩', Optics: '观瞄镜', Ammo: '弹药', Fuel: '油箱',
    Driver: '驾驶员', Gunner: '炮手', Loader: '装填手', Commander: '指挥官',
    Tail: '尾翼', Elevators: '升降舵', Ailerons: '副翼', Weapons: '武器',
    Landing: '起落架', Rotor: '旋翼'
  };
  const SUM = s => s.replace(/[A-Za-z]+/g, w => ABBR[w] || trName(w));
  const FACING = { front: '正面', rear: '尾部', side: '侧面', top: '顶部' };
  const DC = { BOW: '船头', MID: '船中', STERN: '船尾' };

  rules.push(
    // ---- 阵亡后的重新出击长句(先匹配带固定后缀的组合句) ----
    { re: /^([\s\S]+) You did not bail out — choose another ship or restart from harbor\.$/, out: m => R(m[1]) + '你没能跳伞——另选一艘战舰，或从海港重新开始。' },
    { re: /^([\s\S]+) Your crew was lost — pick a replacement from harbor\.$/, out: m => R(m[1]) + '车组全员牺牲——去海港选一艘替补战舰吧。' },
    { re: /^Kamikaze run on the (.+)!$/, out: m => '神风撞向了' + trName(m[1]) + '！' },
    { re: /^Crashed into the (.+)!$/, out: m => '撞上了' + trName(m[1]) + '！' },
    { re: /^Tank knocked out \[(front|rear|side|top)\]!$/, out: m => '坦克被击毁[' + FACING[m[1]] + ']！' },
    { re: /^Tank hit \[(front|rear|side|top)\] (\d+)%([\s\S]*)$/, out: m => '坦克中弹[' + FACING[m[1]] + '] ' + m[2] + '%' + SUM(m[3]) },

    // ---- ⚠ 家族:由具体到宽泛 ----
    { re: /^⚠ ENEMY OFFENSIVE — (\d+) warships inbound!$/, out: m => '⚠ 敌军大举进攻——' + m[1] + ' 艘战舰来袭！' },
    { re: /^⚠ (.+) COMMAND POST DESTROYED — ISLAND NEUTRALIZED$/, out: m => '⚠ ' + trName(m[1]) + ' 的指挥所被摧毁——岛屿失去归属' },
    { re: /^⚠ (.+) LOST — enemy forces captured the outpost$/, out: m => '⚠ 失去了 ' + trName(m[1]) + '——敌军占领了前哨' },
    { re: /^⚠ (.+?) (damaged|CRITICAL|DESTROYED)$/, out: m => '⚠ ' + trName(m[1]) + ' ' + trName(m[2]) },

    // ---- 🏝 家族 ----
    { re: /^🏝 (.+) SECURED — command post established; construction unlocked$/, out: m => '🏝 拿下 ' + trName(m[1]) + '——指挥所已建立，可以开工建造了' },
    { re: /^🏝 (.+) — refueling and rearming$/, out: m => '🏝 ' + trName(m[1]) + '——正在加油补弹' },

    // ---- 💥 家族 ----
    { re: /^💥 (.+) torn off!$/, out: m => '💥 ' + trName(m[1]) + ' 整个被打飞了！' },

    // ---- 🔧 家族 ----
    { re: /^🔧 DAMAGE CONTROL PRIORITY: (BOW|MID|STERN)$/, out: m => '🔧 损管优先：' + DC[m[1]] },
    { re: /^🔧 (.+) repaired$/, out: m => '🔧 ' + trName(m[1]) + ' 修好了' },

    // ---- 天气 / 声音 / 装备 / 打捞 / 水雷 ----
    { re: /^⛅ Weather: (.+)$/, out: m => '⛅ 天气：' + trName(m[1]) },
    { re: /^🔊 Sound (ON|OFF)$/, out: m => '🔊 声音：' + (m[1] === 'ON' ? '开' : '关') },
    { re: /^Equipped (.+)$/, out: m => '装备了 ' + trName(m[1]) },
    { re: /^📦 Salvaged \$(\d+)$/, out: m => '📦 打捞到 $' + m[1] },
    { re: /^Mine rack reloading — (\d+)s$/, out: m => '水雷架装填中——' + m[1] + ' 秒' },
    { re: /^A naval mine costs \$(\d+)$/, out: m => '布一颗水雷要花 $' + m[1] },

    // ---- 任务 / 空降 / 战区开场 ----
    { re: /^✅ OBJECTIVE COMPLETE — \+\$(\d+)$/, out: m => '✅ 任务完成——+$' + m[1] },
    { re: /^★ NEW OBJECTIVE — (.+) \(\$(\d+)\)$/, out: m => '★ 新任务——' + R(m[1]) + '（$' + m[2] + '）' },
    { re: /^🪂 AIRBORNE ASSAULT — landed at (.+)\. Secure every island\.$/, out: m => '🪂 空降突击——降落在' + R(m[1]) + '。去占领所有岛屿！' },
    // 战区开场横幅:名字被大写显示,主题句是 CAMPAIGN[i].theme 原文——按名字反查
    // CAMPAIGN/CAMPAIGN_ZH(按下标对齐)取全中文;字典不在场时退回 trName()。
    { re: /^⚔ (.+?) — ([\s\S]+)$/, out: m => {
        let zn = null, zt = null;
        if (typeof CAMPAIGN !== 'undefined' && typeof CAMPAIGN_ZH !== 'undefined') {
          const i = CAMPAIGN.findIndex(c => c && c.name && c.name.toUpperCase() === m[1].toUpperCase());
          if (i >= 0 && CAMPAIGN_ZH[i]) { zn = CAMPAIGN_ZH[i].name; if (CAMPAIGN[i].theme === m[2]) zt = CAMPAIGN_ZH[i].theme; }
        }
        return '⚔ ' + (zn || trName(m[1])) + '——' + (zt || trName(m[2]));
      } },
    { re: /^⚕ Hit on foot — (\d+)% health$/, out: m => '⚕ 你中弹了——生命值 ' + m[1] + '%' },

    // ---- 坦克动态句 ----
    { re: /^Crewing the (.+) — WASD drive · Mouse aim · Click fire · E to dismount\.$/, out: m => '开上' + R(m[1]) + '——WASD 驾驶 · 鼠标瞄准 · 点击开火 · E 下车。' },
    { re: /^🪖 Tank ashore on (.+) — clear the garrison to capture · G to re-embark$/, out: m => '🪖 坦克登上 ' + trName(m[1]) + '——消灭守军就能占领 · G 回船' },

    // ---- 声呐 / 升级 / 建造 ----
    { re: /^SONAR recharging — (\d+)s$/, out: m => '声呐充能中——' + m[1] + ' 秒' },
    { re: /^(.+) → Lv (\d+)$/, out: m => trName(m[1]) + ' → Lv ' + m[2] },
    { re: /^Go ashore on an island \(G\) to emplace (.+)$/, out: m => '先按 G 登岛，才能布设' + trName(m[1]) },
    { re: /^Swim to dry land before building (.+)$/, out: m => '先游上岸，才能建造' + trName(m[1]) },
    { re: /^(.+) is too large for that patch of ground$/, out: m => trName(m[1]) + ' 太大了，这块地放不下' },
    { re: /^(.+) constructed — OFFLINE until a power station is built$/, out: m => trName(m[1]) + ' 建好了——在建成发电站之前处于断电状态' },
    { re: /^(.+) constructed$/, out: m => trName(m[1]) + ' 建好了' },
    { re: /^Scrapped (.+) \(\+\$(\d+)\)$/, out: m => '拆掉了 ' + trName(m[1]) + '（+$' + m[2] + '）' },
    { re: /^Gun limit reached — this hull mounts only (\d+) guns$/, out: m => '火炮满了——这艘船最多装 ' + m[1] + ' 门炮' },

    // ---- 飞机 / 坦克购买与派遣 ----
    { re: /^🤖 (.+) launched under AI control — it fights for you$/, out: m => '🤖 ' + trName(m[1]) + ' 由 AI 驾驶起飞——它会替你作战' },
    { re: /^(.+) ready on deck — press E aboard it to fly$/, out: m => trName(m[1]) + ' 已停上甲板——走过去按 E 起飞' },
    { re: /^(.+) delivered beside you — press E near it to crew it$/, out: m => trName(m[1]) + ' 已送到你身边——靠近按 E 上车' },
    { re: /^(.+) loaded on deck — walk up and press E to crew it$/, out: m => trName(m[1]) + ' 已装上甲板——走过去按 E 上车' },

    // ---- 飞行中弹 ----
    { re: /^Hit! (\d+)%([\s\S]*)$/, out: m => '中弹！' + m[1] + '%' + SUM(m[2]) },

    // ---- R-36M ----
    { re: /^R-36M reloading — (\d+) seconds$/, out: m => 'R-36M 装填中——' + m[1] + ' 秒' },
    { re: /^R-36M reloading: (\d+) seconds\. Select another silo or press N to close\.$/, out: m => 'R-36M 装填中：' + m[1] + ' 秒。选别的发射井，或按 N 关闭。' },

    // ---- 登岸 ----
    { re: /^Ashore on (.+)! WASD to walk · G to re-board near your ship\.$/, out: m => '登上' + trName(m[1]) + '了！WASD 走动 · 靠近战舰按 G 回船。' },

    // ---- 聊天 ----
    { re: /^STATUS: Hull (\d+)% · \$(\d+) · Fleet (\d+)v(\d+) · Islands (\d+)\/(\d+)$/, out: m => '状态：船体 ' + m[1] + '% · $' + m[2] + ' · 舰队 ' + m[3] + 'v' + m[4] + ' · 岛屿 ' + m[5] + '/' + m[6] },
    { re: /^UNKNOWN COMMAND: \/(.*) — type \/help$/, out: m => '未知指令：/' + m[1] + '——输入 /help 查看帮助' },
    { re: /^CAPTAIN: ([\s\S]*)$/, out: m => '舰长：' + m[1] },

    // ---- Claude 动态提示 ----
    { re: /^★ Objective: (.+) — pays \$(\d+)\.$/, out: m => '★ 任务：' + R(m[1]) + '——完成奖励 $' + m[2] + '。' },
    { re: /^\$(\d+) in the bunkers — Tab for guns, H for harbor upgrades\.$/, out: m => '仓库里存着 $' + m[1] + '——Tab 买炮，H 升级海港。' },

    // ---- 舰队无线电动态句 ----
    { re: /^Moving to secure (.+)\.$/, out: m => '正去占领' + R(m[1]) + '。' },
    { re: /^Copy — inbound to cover (.+)\.$/, out: m => '收到——马上赶去支援 ' + m[1] + '。' },

    // ---- 宽泛兜底(务必放最后):critMsg 与坦克摧毁广播 ----
    { re: /^⚠ (.+)$/, out: m => '⚠ ' + R(m[1]) },
    { re: /^💥 (.+)$/, out: m => '💥 ' + R(m[1]) }
  );
  return rules;
})();
