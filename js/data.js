// 佛经目录索引数据 - 用于侧边栏即时加载目录
const SUTRA_CATALOG = [
  {
    id: "xin-jing",
    title: "般若波罗蜜多心经",
    translator: "唐·三藏法师玄奘 译",
    category: "般若部",
    tags: ["核心", "智慧", "大乘"],
    introduction: "《心经》是大乘佛教中非常重要的经典，仅用二百六十余字，便阐述了大乘佛教的核心智慧——空性（五蕴皆空），是佛教般若经系的精髓。"
  },
  {
    id: "dabei-zhou",
    title: "千手千眼无碍大悲心陀罗尼 (大悲咒)",
    translator: "唐·西天竺沙门伽梵达摩 译",
    category: "密教部",
    tags: ["持诵", "慈悲", "消灾"],
    introduction: "《大悲咒》是观世音菩萨宣说的无上陀罗尼，大慈大悲，威力无比，能除一切恶道，消一切灾难，满一切善愿。"
  },
  {
    id: "jingang-jing",
    title: "金刚般若波罗蜜经",
    translator: "姚秦·三藏法师鸠摩罗什 译",
    category: "般若部",
    tags: ["智慧", "断疑", "大乘"],
    introduction: "《金刚经》阐述般若空性，破除一切我相、人相、众生相、寿者相。此处收录大秦鸠摩罗什大师译本完整三十二分。"
  },
  {
    id: "pumen-pin",
    title: "妙法莲华经·观世音菩萨普门品",
    translator: "姚秦·三藏法师鸠摩罗什 译",
    category: "法华部",
    tags: ["应化", "慈悲", "感应"],
    introduction: "《普门品》出自《妙法莲华经》第二十五品，详述观世音菩萨大慈大悲，游诸国土，度脱众生，寻声救苦，无愿不从的广大功德。"
  },

  {
    id: "zhong-lun",
    title: "中论",
    translator: "龙树菩萨造 / 姚秦鸠摩罗什 译",
    category: "中观部",
    tags: ["中道", "空性", "八不"],
    introduction: "《中论》是中观学派的根本奠基之作，由龙树菩萨撰写颂词，鸠摩罗什大师翻译。通过“八不中道”破除一切边见执着。收录完整四卷二十七品。"
  },
  {
    id: "daodejing",
    title: "道德经",
    translator: "春秋·老子 著",
    category: "道家经典",
    tags: ["道家", "哲学", "自然"],
    introduction: "《道德经》是道家学派的开山奠基之作。全文分《道经》与《德经》，以深邃高妙的语言阐述了“道法自然”与“无为而治”的至高哲理。"
  },
  {
    id: "taishang",
    title: "太上感应篇",
    translator: "传为太上老君说",
    category: "道家经典",
    tags: ["道家", "积善", "因果"],
    introduction: "《太上感应篇》是道教极其重要的劝善书，旨在劝人向善，阐述“祸福无门，唯人自召；善恶之报，如影随形”的因果道理。其内容融合了道家、儒家及佛教的思想，是中国古代流传最广、影响最大的修身积善经典。"
  },
  {
    id: "lunyu",
    title: "论语",
    translator: "孔子弟子及再传弟子 记述",
    category: "儒家经典",
    tags: ["儒家", "仁义", "修身"],
    introduction: "《论语》记录了孔子及其弟子的言行，以语录体形式集中体现了孔子的政治、审美、道德及教育主张，是儒家学派的核心经典。"
  },
  {
    id: "zhong-yong",
    title: "中庸",
    translator: "战国·子思 著",
    category: "儒家经典",
    tags: ["儒家", "中和", "修身"],
    introduction: "《中庸》是儒家学派的经典论著之一，原为《礼记》中的一篇，相传为孔子之孙子思所作。主要阐述“中和之德”与“至诚尽性”的人性修养哲理，被尊为“四书”之一。"
  },
  {
    id: "liaofan",
    title: "了凡四训",
    translator: "明·袁了凡 著",
    category: "修身经典",
    tags: ["修身", "改过", "积善"],
    introduction: "《了凡四训》是明代袁了凡写给儿子的家训。通过作者自身改命的亲身经历，系统阐述了“命由我作，福自己求”的立命之学，以及改过之法、积善之方与谦德之效，是公认的修身治心经典。"
  }
];

// 将数据导出（如果是在浏览器中全局挂载则直接挂在 window 上，或者通过 standard ES module）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SUTRA_DATA: SUTRA_CATALOG };
} else {
  window.SUTRA_DATA = SUTRA_CATALOG;
}
