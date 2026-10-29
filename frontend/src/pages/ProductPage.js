import React, { useState, useEffect, useRef } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { LuLock, LuUser, LuRefreshCw, LuArrowRight, LuArrowDown, LuAlertCircle, LuShoppingCart, LuChevronRight } from "react-icons/lu";
import { FaWhatsapp } from "react-icons/fa6";
import { useAuth } from "./AuthContext";
import { useCart } from "./CartContext";
import { getProduct } from "../api/products";
import { Accordion, Alert, Button, Container, Price, SafeHtml, Section, StatusMessage } from "../components/ui";
import PlanSelector from "../components/store/PlanSelector";
import ProductImage from "../components/store/ProductImage";
import { categoryTint } from "../components/store/ProductCard";
import ProofsGallery from "../components/store/ProofsGallery";
import {
  formatPlanDuration,
  isPlanAvailable,
  isProductInStock,
  getPlanPricing,
  convertUsdToInr,
  formatINR,
  formatUSD,
  monthlyPrice,
} from "../utils/pricing";
import { MAX_CART_LINES, MAX_ITEM_QUANTITY } from "../utils/cart";
import "./ProductPage.css";

const purchaseSteps = [
  { title: "Choose your plan", desc: "Pick the plan length that suits you." },
  { title: "Sign in and review", desc: "Log in or create an account, then confirm your order total." },
  { title: "Pay by UPI", desc: "Pay from any UPI app and enter the 12-digit UTR from your receipt." },
  { title: "Get your access", desc: "We verify the payment and send access, usually within 15–30 minutes." },
];

const faqItems = [
  { q: "How fast will I receive access after payment?", a: "Once your UTR is matched against our bank statement, access details are sent on WhatsApp — usually within 15–30 minutes." },
  { q: "What if something doesn't work?", a: "We offer a replacement guarantee. Message us on Telegram with your order ID and we'll fix or replace it, no questions asked." },
  { q: "Do you offer refunds?", a: "Refunds are handled per our Refund Policy, linked in the footer. Digital delivery issues are covered — reach out and we'll sort it quickly." },
  { q: "Is my payment secure?", a: "You pay inside your own UPI app, so your bank details never pass through this website. We only ask for the 12-digit UTR to match your payment." },
];

const expectations = [
  { term: "Delivery", text: "Access details by WhatsApp or email, usually 15–30 minutes after your payment is verified.", Icon: FaWhatsapp },
  { term: "Payment", text: "UPI from any app. Your bank details never pass through this site.", Icon: LuLock },
  { term: "Your account", text: "Single ownership — the plan is for your own account.", Icon: LuUser },
  { term: "Guarantee", text: "A replacement if it stops working during your plan.", Icon: LuRefreshCw },
];

const dummyProofImages = [
{ "id": 1, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469334/proofs/fmvjx8nf4m0qkytv1tm9.jpg", "label": "4965327411218590780.jpg" },
  { "id": 150, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469668/proofs/awdtfsw09onj47wtrw4s.jpg", "label": "IMG_20240921_015225_765.jpg" },
  { "id": 151, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469671/proofs/r8yjb9r8vsjf1qqpk0kx.jpg", "label": "IMG_20240921_015227_341.jpg" },
  { "id": 152, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469673/proofs/p9fcchhgnqdszjvv5zfd.jpg", "label": "Screenshot_2024-09-21-01-49-35-18_948cd9899890cbd5c2798760b2b95377.jpg" },
  { "id": 2, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469340/proofs/lapgci9ggunou3ooyo4b.jpg", "label": "4965327411218590781.jpg" },
  { "id": 3, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469344/proofs/dljlnvnndba4h3kp8j97.jpg", "label": "5010499051149437833.jpg" },
  { "id": 4, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469348/proofs/edowg2cntli4p13akpdh.jpg", "label": "5010499051149437834.jpg" },
  { "id": 5, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469351/proofs/rwsickhxkeew0cta2ags.jpg", "label": "5010499051149437835.jpg" },
  { "id": 6, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469354/proofs/aaaiyotd3xqajabx1udk.jpg", "label": "6066875063946303840.jpg" },
  { "id": 7, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469355/proofs/lfyo6h6p4hemnjm6v30z.jpg", "label": "6066875063946303841.jpg" },
  { "id": 8, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469357/proofs/dzgygxhpqeuifm0ys4xg.jpg", "label": "6066875063946303842.jpg" },
  { "id": 9, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469359/proofs/igqrahru8hy01x722qsz.jpg", "label": "6066875063946303845.jpg" },
  { "id": 10, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469361/proofs/okzo2goo1rdugpafgszn.jpg", "label": "6066875063946303846.jpg" },
  { "id": 11, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469363/proofs/beq1c5ory4btbv2zyve0.jpg", "label": "6066875063946303848.jpg" },
  { "id": 12, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469364/proofs/gc23wfcnjhml5fiupvuk.jpg", "label": "6066875063946303853.jpg" },
  { "id": 13, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469366/proofs/izhegzwyq8tdh3yxalis.jpg", "label": "6066875063946303854.jpg" },
  { "id": 14, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469368/proofs/vwg4rjt7masyuneeioky.jpg", "label": "6066875063946303858.jpg" },
  { "id": 15, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469370/proofs/orefau6fvz4gwo04tl6y.jpg", "label": "6066875063946303862.jpg" },
  { "id": 16, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469372/proofs/skrzjtyu6xu1sc9xeewx.jpg", "label": "6066875063946303863.jpg" },
  { "id": 17, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469374/proofs/py97wyo9qsk2mufyyxrs.jpg", "label": "6066875063946303864.jpg" },
  { "id": 18, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469375/proofs/wc0vzrwusvju5pssipcx.jpg", "label": "6066875063946303865.jpg" },
  { "id": 19, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469377/proofs/gryk4w9bccjas115bvvm.jpg", "label": "6087093317549536791.jpg" },
  { "id": 20, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469379/proofs/pi6rqm0lqbqbnxmt7aib.jpg", "label": "6087093317549536792.jpg" },
  { "id": 21, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469381/proofs/rnzjj1j5ykn9clkggrkh.jpg", "label": "6087093317549536793.jpg" },
  { "id": 22, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469384/proofs/xatg9sjvcfiqrycg9kbx.jpg", "label": "6087093317549536794.jpg" },
  { "id": 23, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469387/proofs/hgidhrhrgazpjtpafcdr.jpg", "label": "6087093317549536795.jpg" },
  { "id": 24, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469389/proofs/ogwcn2puovjrvb97d4sn.jpg", "label": "6087093317549536796.jpg" },
  { "id": 25, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469391/proofs/a0qya4binyo2k5go9puu.jpg", "label": "6087093317549536797.jpg" },
  { "id": 26, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469393/proofs/x6t3hhwpu3exycrwi99l.jpg", "label": "6095723483100199925.jpg" },
  { "id": 27, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469395/proofs/c8yabvlemb0nisx9xaat.jpg", "label": "6095723483100199926.jpg" },
  { "id": 28, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469397/proofs/knltyik56mbf9ockuakf.jpg", "label": "6095723483100199927.jpg" },
  { "id": 29, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469401/proofs/m6nxmorpy14dy15umjnr.jpg", "label": "6095723483100199928.jpg" },
  { "id": 30, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469407/proofs/qwhve5hjuxxbngrcw2he.jpg", "label": "6095723483100199929.jpg" },
  { "id": 31, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469409/proofs/umosdw5lm4rwlfaaszps.jpg", "label": "6095723483100199932.jpg" },
  { "id": 32, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469412/proofs/blekmsqt4xhdmrmrns4p.jpg", "label": "6095723483100199935.jpg" },
  { "id": 33, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469415/proofs/qfdvbql67mvbee1dx0jz.jpg", "label": "6095723483100199936.jpg" },
  { "id": 34, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469417/proofs/d2jnrrvsjqlspj2maryi.jpg", "label": "6095723483100199937.jpg" },
  { "id": 35, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469419/proofs/kw5tnszsmzxonvybdxn1.jpg", "label": "6102680325097372645.jpg" },
  { "id": 36, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469420/proofs/lvolb9mwthgztgqyzrag.jpg", "label": "6102680325097372646.jpg" },
  { "id": 37, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469422/proofs/ohg3cm7jhhlnpwb9f7fg.jpg", "label": "6102680325097372647.jpg" },
  { "id": 38, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469425/proofs/mcahbeds7dfjjokswubs.jpg", "label": "6248919615019266447.jpg" },
  { "id": 39, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469427/proofs/icoljyzxeillzmyvdewx.jpg", "label": "6248919615019266449.jpg" },
  { "id": 40, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469429/proofs/j2mnyt1reogty1i7cdwl.jpg", "label": "6253423214646636824.jpg" },
  { "id": 41, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469431/proofs/qi8iychdfh5s4gssi9r6.jpg", "label": "6253423214646636825.jpg" },
  { "id": 42, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469433/proofs/oybl2pksvjddf1e4vtii.jpg", "label": "6264694785084341909.jpg" },
  { "id": 43, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469437/proofs/fyrhljj4ndjwbki3wbm8.jpg", "label": "6276209583814981608.jpg" },
  { "id": 44, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469439/proofs/ibfheetux6blo1nghk9q.jpg", "label": "6276209583814981609 (1).jpg" },
  { "id": 45, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469442/proofs/mfoqp1r2wm05nlmjxycb.jpg", "label": "6276209583814981609.jpg" },
  { "id": 46, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469444/proofs/bwsd6pz9uxmrqdhq9hj3.jpg", "label": "6276209583814981610.jpg" },
  { "id": 47, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469447/proofs/cxmmodaga7vang7qgrlm.jpg", "label": "6276209583814981611.jpg" },
  { "id": 48, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469449/proofs/z5n8u81ljy83b8vm19v8.jpg", "label": "6276209583814981612.jpg" },
  { "id": 49, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469451/proofs/nuxa25e6ii9oh9vxdzss.jpg", "label": "IMG_20240829_032555_785.jpg" },
  { "id": 50, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469452/proofs/sur7job6tppdqpjreann.jpg", "label": "IMG_20240829_032610_415.jpg" },
  { "id": 51, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469454/proofs/xkwf3qhuhvhz4z8blh2p.jpg", "label": "IMG_20240829_032617_985.jpg" },
  { "id": 52, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469456/proofs/mi67lixidhhqphrfw0bo.jpg", "label": "IMG_20240829_032627_779.jpg" },
  { "id": 53, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469458/proofs/lbwrtqs5uhiojiunxsgj.jpg", "label": "IMG_20240829_032639_961.jpg" },
  { "id": 54, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469460/proofs/qfcfeolxhfquqdsnbnpq.jpg", "label": "IMG_20240829_032643_716.jpg" },
  { "id": 55, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469462/proofs/rtg47rvsvbgvxfyjwkne.jpg", "label": "IMG_20240829_032646_997.jpg" },
  { "id": 56, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469465/proofs/pa4qpounbu2p6dm3ruir.jpg", "label": "IMG_20240829_032650_209.jpg" },
  { "id": 57, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469466/proofs/lvpw797dyhavv3vlptb7.jpg", "label": "IMG_20240829_032657_219.jpg" },
  { "id": 58, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469468/proofs/xyrcryvu3d71cz2agyzo.jpg", "label": "IMG_20240829_032701_257.jpg" },
  { "id": 59, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469470/proofs/mcyur70fsebxuabznoe8.jpg", "label": "IMG_20240829_032704_854.jpg" },
  { "id": 60, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469473/proofs/oxrv0occaqjcmu7un5ih.jpg", "label": "IMG_20240829_032708_164.jpg" },
  { "id": 61, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469475/proofs/lma8hw7adrs454fwvjys.jpg", "label": "IMG_20240829_032715_213.jpg" },
  { "id": 62, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469477/proofs/qixa5mx2irmdoc2dkjeg.jpg", "label": "IMG_20240829_032725_315.jpg" },
  { "id": 63, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469479/proofs/lxlrdrdyjnomyc8vvdou.jpg", "label": "IMG_20240829_032729_506.jpg" },
  { "id": 64, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469481/proofs/nqpf7mc5ryacasbwfufh.jpg", "label": "IMG_20240829_032733_541.jpg" },
  { "id": 65, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469483/proofs/wrcbbfybnhoqiwvz2ydl.jpg", "label": "IMG_20240829_032744_498.jpg" },
  { "id": 66, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469485/proofs/j45wppbdko5fq6i4drwu.jpg", "label": "IMG_20240829_032748_020.jpg" },
  { "id": 67, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469487/proofs/se09cl1w6t3qiaeg29kp.jpg", "label": "IMG_20240829_032757_562.jpg" },
  { "id": 68, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469489/proofs/jmxjnc0epdly8gvkflzz.jpg", "label": "IMG_20240829_032804_641.jpg" },
  { "id": 69, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469491/proofs/g22hkr3s18o0m6idg7ck.jpg", "label": "IMG_20240829_032808_491.jpg" },
  { "id": 70, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469493/proofs/bfv0svn0lt8mwrvz9jul.jpg", "label": "IMG_20240829_032821_445.jpg" },
  { "id": 71, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469495/proofs/ypf4crmiyw8my3fsmhdu.jpg", "label": "IMG_20240829_032825_443.jpg" },
  { "id": 72, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469497/proofs/awplv8lk4zcjtasvtava.jpg", "label": "IMG_20240829_032837_071.jpg" },
  { "id": 73, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469499/proofs/ynolkpkcm3vigeygcrg1.jpg", "label": "IMG_20240829_032841_270.jpg" },
  { "id": 74, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469501/proofs/flbyxhjg6vf1e6u1eqq9.jpg", "label": "IMG_20240829_032843_640.jpg" },
  { "id": 75, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469503/proofs/z38g1srtec0k3bi46nnf.jpg", "label": "IMG_20240829_032847_082.jpg" },
  { "id": 76, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469505/proofs/fstpptva9xjmhbgmrzui.jpg", "label": "IMG_20240829_032850_981.jpg" },
  { "id": 77, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469508/proofs/rpokoj6k12272thesdai.jpg", "label": "IMG_20240829_032854_900.jpg" },
  { "id": 78, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469510/proofs/ygluc7qvqlnio3jnbk8w.jpg", "label": "IMG_20240829_032859_225.jpg" },
  { "id": 79, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469512/proofs/tr81r1zkgi8sc9opg09c.jpg", "label": "IMG_20240829_032902_829.jpg" },
  { "id": 80, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469514/proofs/xcjkj9tr29gyhccqneuk.jpg", "label": "IMG_20240829_032907_545.jpg" },
  { "id": 81, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469518/proofs/yoniue6g2its5bsp5gvo.jpg", "label": "IMG_20240829_032910_338.jpg" },
  { "id": 82, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469520/proofs/v3qkxgmwnlraio0venhr.jpg", "label": "IMG_20240829_032944_079.jpg" },
  { "id": 83, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469522/proofs/xbgn170zqzepqr1xpz5c.jpg", "label": "IMG_20240829_032947_814.jpg" },
  { "id": 84, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469525/proofs/mipgnvvjwvv362uvd1ww.jpg", "label": "IMG_20240829_032957_535.jpg" },
  { "id": 85, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469528/proofs/qkjzc1voomb0s6jshafd.jpg", "label": "IMG_20240829_033007_936.jpg" },
  { "id": 86, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469530/proofs/hlbbftio2cyhzyt7oxqi.jpg", "label": "IMG_20240829_033013_278.jpg" },
  { "id": 87, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469532/proofs/xzzdsqcprl8fd628bzyr.jpg", "label": "IMG_20240829_033036_547.jpg" },
  { "id": 88, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469535/proofs/jzcdrhgrkoxusrwoknc8.jpg", "label": "IMG_20240829_033040_147.jpg" },
  { "id": 89, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469538/proofs/sfswwdj1kvwncs6qqocz.jpg", "label": "IMG_20240829_033045_317.jpg" },
  { "id": 90, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469540/proofs/qpn5xbc56xg7l7ri5hpg.jpg", "label": "IMG_20240829_033051_252.jpg" },
  { "id": 91, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469542/proofs/wspsw9brtdckl41ulmdn.jpg", "label": "IMG_20240921_014757_873.jpg" },
  { "id": 92, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469544/proofs/xn8hus0rkim4wgrsoqm0.jpg", "label": "IMG_20240921_014759_230.jpg" },
  { "id": 93, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469547/proofs/koplkwqixjigcr8r8ldc.jpg", "label": "IMG_20240921_014759_965.jpg" },
  { "id": 94, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469548/proofs/dllziy4aret49kikegvh.jpg", "label": "IMG_20240921_014800_679.jpg" },
  { "id": 95, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469551/proofs/eb9ehtqduyqpz0ltkwi9.jpg", "label": "IMG_20240921_014801_814.jpg" },
  { "id": 96, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469552/proofs/rsbu3atosvx9dfvcvxno.jpg", "label": "IMG_20240921_014803_405.jpg" },
  { "id": 97, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469556/proofs/qff2h7ten1v0gncxojde.jpg", "label": "IMG_20240921_014803_886.jpg" },
  { "id": 98, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469558/proofs/yp5mqhihsfdlzzd7eibs.jpg", "label": "IMG_20240921_014805_874.jpg" },
  { "id": 99, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469560/proofs/bi439iyyfwbnsttj5kyc.jpg", "label": "IMG_20240921_014806_490.jpg" },
  { "id": 100, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469561/proofs/ch0wxoxj3caws5tnte2y.jpg", "label": "IMG_20240921_014807_239.jpg" },
  { "id": 101, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469562/proofs/ixm3x0hnjiqeqcdsnj4s.jpg", "label": "IMG_20240921_014808_621.jpg" },
  { "id": 102, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469565/proofs/jddzpxsfy54ovzmhpya2.jpg", "label": "IMG_20240921_014810_166.jpg" },
  { "id": 103, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469566/proofs/hewxm2xj33riwnmulf0f.jpg", "label": "IMG_20240921_014810_877.jpg" },
  { "id": 104, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469569/proofs/xkfqfsemfnajq4jlpozz.jpg", "label": "IMG_20240921_014811_603.jpg" },
  { "id": 105, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469570/proofs/da1spja4ihnrrsxekwtv.jpg", "label": "IMG_20240921_014813_979.jpg" },
  { "id": 106, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469572/proofs/xs49zch4h7jbbtgxuicm.jpg", "label": "IMG_20240921_014814_858.jpg" },
  { "id": 107, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469574/proofs/dp3h6nshtpzfb9qpag3u.jpg", "label": "IMG_20240921_014816_986.jpg" },
  { "id": 108, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469575/proofs/l3wbcszalmblvqi13jlj.jpg", "label": "IMG_20240921_014817_855.jpg" },
  { "id": 109, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469581/proofs/jwq9xxiw2tocavhqy2br.jpg", "label": "IMG_20240921_014818_951.jpg" },
  { "id": 110, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469582/proofs/o9o7donkctrapwxql3vs.jpg", "label": "IMG_20240921_014820_250.jpg" },
  { "id": 111, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469584/proofs/dwksjero6ffcpyk24fr1.jpg", "label": "IMG_20240921_014822_026.jpg" },
  { "id": 112, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469586/proofs/bhjstrolb5oyw6svxrxo.jpg", "label": "IMG_20240921_014822_409.jpg" },
  { "id": 113, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469587/proofs/ak8fz13een25a0liu8tj.jpg", "label": "IMG_20240921_014823_457.jpg" },
  { "id": 114, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469592/proofs/fzupt7a2xobxyi5x7o5z.jpg", "label": "IMG_20240921_014825_600.jpg" },
  { "id": 115, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469594/proofs/z9yt3vylzq6hyhyepvtp.jpg", "label": "IMG_20240921_014827_215.jpg" },
  { "id": 116, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469596/proofs/gmfvxohcbq3r94iy9hap.jpg", "label": "IMG_20240921_015129_109.jpg" },
  { "id": 117, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469599/proofs/agqmlnhomcprqshz39b5.jpg", "label": "IMG_20240921_015131_212.jpg" },
  { "id": 118, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469602/proofs/rrs4wgnpasjd5o8ddroc.jpg", "label": "IMG_20240921_015131_989.jpg" },
  { "id": 119, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469604/proofs/ulmthniyg5mwnk62losb.jpg", "label": "IMG_20240921_015133_615.jpg" },
  { "id": 120, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469606/proofs/h5bhrpkj1i4vpbba15ut.jpg", "label": "IMG_20240921_015135_076.jpg" },
  { "id": 121, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469608/proofs/rwaqwa1nhewg2amvsryd.jpg", "label": "IMG_20240921_015136_289.jpg" },
  { "id": 122, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469613/proofs/sndmk0c3mglpj8jaqsbw.jpg", "label": "IMG_20240921_015138_829.jpg" },
  { "id": 123, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469615/proofs/etrkrucnmqpgs2hyu3j9.jpg", "label": "IMG_20240921_015140_209.jpg" },
  { "id": 124, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469616/proofs/n069fx6bokusp02vwief.jpg", "label": "IMG_20240921_015141_402.jpg" },
  { "id": 125, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469618/proofs/adnqyd8xhnocexyvi3nz.jpg", "label": "IMG_20240921_015142_096.jpg" },
  { "id": 126, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469620/proofs/rmgo4vskq1srwmkpgwe4.jpg", "label": "IMG_20240921_015144_075.jpg" },
  { "id": 127, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469621/proofs/a9kvdtxg5ycsuixjtaaw.jpg", "label": "IMG_20240921_015145_716.jpg" },
  { "id": 128, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469623/proofs/voyfsisteribccfrkjxs.jpg", "label": "IMG_20240921_015149_108.jpg" },
  { "id": 129, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469624/proofs/xryptdz8uosxjkxuvp8h.jpg", "label": "IMG_20240921_015150_914.jpg" },
  { "id": 130, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469625/proofs/lyzth99bbaecfw15ss0z.jpg", "label": "IMG_20240921_015151_365.jpg" },
  { "id": 131, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469628/proofs/qfrqp0x9t8kfhw5ori3x.jpg", "label": "IMG_20240921_015153_505.jpg" },
  { "id": 132, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469630/proofs/eoryforijcytszzkjut9.jpg", "label": "IMG_20240921_015155_102.jpg" },
  { "id": 133, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469631/proofs/h1ljx3u6qrmhds58nwbg.jpg", "label": "IMG_20240921_015157_538.jpg" },
  { "id": 134, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469633/proofs/y0g4admi8ryjwn99p94u.jpg", "label": "IMG_20240921_015158_990.jpg" },
  { "id": 135, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469637/proofs/xkwtjh4g5fxzh0svk5lq.jpg", "label": "IMG_20240921_015200_281.jpg" },
  { "id": 136, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469638/proofs/w8wwvj7itfyuix3aj4wb.jpg", "label": "IMG_20240921_015201_771.jpg" },
  { "id": 137, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469640/proofs/wdbwajvkgdevu0wse6oe.jpg", "label": "IMG_20240921_015203_836.jpg" },
  { "id": 138, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469642/proofs/bfr6qge4ov4xniawgunh.jpg", "label": "IMG_20240921_015204_982.jpg" },
  { "id": 139, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469643/proofs/ypahf4ten9oah1qzywub.jpg", "label": "IMG_20240921_015206_341.jpg" },
  { "id": 140, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469647/proofs/in0k0saiveflrjng04op.jpg", "label": "IMG_20240921_015207_833.jpg" },
  { "id": 141, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469650/proofs/j98d8gy0kto29vdk0h4h.jpg", "label": "IMG_20240921_015209_121.jpg" },
  { "id": 142, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469652/proofs/lvsxs6swlwdrjb5sre5w.jpg", "label": "IMG_20240921_015210_421.jpg" },
  { "id": 143, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469654/proofs/ekj8zhq0yz8kxn0l2vjo.jpg", "label": "IMG_20240921_015212_135.jpg" },
  { "id": 144, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469656/proofs/lwupvqjq4uxc0bxg4e7e.jpg", "label": "IMG_20240921_015212_851.jpg" },
  { "id": 145, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469658/proofs/puvkn0dexa35bcypvaw4.jpg", "label": "IMG_20240921_015214_146.jpg" },
  { "id": 146, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469660/proofs/hszbfrovu4swu45dr93v.jpg", "label": "IMG_20240921_015215_188.jpg" },
  { "id": 147, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469661/proofs/gpmfkh8pppuqopl3wmgx.jpg", "label": "IMG_20240921_015217_651.jpg" },
  { "id": 148, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469664/proofs/xwjg7jqrptbsxekeou1r.jpg", "label": "IMG_20240921_015218_449.jpg" },
  { "id": 149, "url": "https://res.cloudinary.com/rblaguvf/image/upload/v1783469666/proofs/muxt6qmqofezvfkqifls.jpg", "label": "IMG_20240921_015219_844.jpg" },
  
];

const ProductPage = () => {
  const navigate = useNavigate();
  const { requireAuth } = useAuth();
  const { addItem } = useCart();

  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [proofsHidden, setProofsHidden] = useState(false);

  const [selectedPlanIndex, setSelectedPlanIndex] = useState(0);

  const [showStickyBar, setShowStickyBar] = useState(false);

  const [cartNotice, setCartNotice] = useState(null);

  const { id } = useParams();
  const buyBtnAnchorRef = useRef(null);
  const proofsSectionRef = useRef(null);

  useEffect(() => {
    setError("");
    setIsLoading(true);

    if (!id || !/^\d+$/.test(id)) {
      setError("Invalid product ID format. ID must be a number.");
      setIsLoading(false);
      return undefined;
    }

    let cancelled = false;
    getProduct(id)
      .then((data) => {
        if (cancelled) return;
        if (!Array.isArray(data.plans) || data.plans.length === 0) {
          throw new Error("This product has no pricing plans configured.");
        }
        const firstAvailableIdx = data.plans.findIndex((plan) => isPlanAvailable(plan));
        setSelectedPlanIndex(firstAvailableIdx !== -1 ? firstAvailableIdx : 0);
        setCartNotice(null);
        setProduct(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "An error occurred while fetching the product.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!product || !buyBtnAnchorRef.current) return;

    const observer = new IntersectionObserver(([entry]) => setShowStickyBar(!entry.isIntersecting), { threshold: 0 });
    observer.observe(buyBtnAnchorRef.current);
    return () => observer.disconnect();
  }, [product, isLoading]);

  const proofImages = product?.proofs && product.proofs.length > 0 ? product.proofs : dummyProofImages;

  const selectPlan = (index) => {
    setSelectedPlanIndex(index);
    setCartNotice(null);
  };

  const handleBuyNowClick = () => {
    const plan = product?.plans?.[selectedPlanIndex];
    if (!product || !plan || typeof plan.price === "undefined") {
      alert("Error: Could not retrieve plan pricing. Please try again in a moment.");
      return;
    }
    if (!isProductInStock(product) || !isPlanAvailable(plan)) {
      return;
    }
    const line = { productId: Number(product.id), planIndex: selectedPlanIndex, planName: formatPlanDuration(plan), quantity: 1 };
    requireAuth(() => navigate("/checkout", { state: { items: [line], source: "buy_now" } }));
  };

  const handleAddToCart = () => {
    const plan = product?.plans?.[selectedPlanIndex];
    if (!plan || !isProductInStock(product) || !isPlanAvailable(plan)) return;
    const planName = formatPlanDuration(plan);
    const result = addItem({
      productId: Number(product.id),
      planIndex: selectedPlanIndex,
      planName,
      unitPrice: Number(plan.price),
      name: product.name,
      image: product.image || "",
    });
    if (result.full) {
      setCartNotice({ variant: "warning", text: `Your cart is full (${MAX_CART_LINES} products). Check out or remove something first.` });
    } else if (result.added === 0) {
      setCartNotice({ variant: "warning", text: `You already have the maximum of ${MAX_ITEM_QUANTITY} of this plan in your cart.` });
    } else {
      setCartNotice({
        variant: "success",
        text:
          result.quantity > 1
            ? `Added — you now have ${result.quantity} of ${planName} in your cart.`
            : `Added ${planName} to your cart.`,
      });
    }
  };

  const scrollToProofs = () => {
    setProofsHidden(false);
    requestAnimationFrame(() => {
      proofsSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  if (isLoading) {
    return (
      <Container className="pdp-state">
        <StatusMessage loading title="Loading product details…" />
      </Container>
    );
  }

  if (error || !product) {
    return (
      <Container className="pdp-state">
        <StatusMessage
          icon={<LuAlertCircle />}
          title="We couldn't load this product"
          text={error || "Product not found"}
          action={
            <Button to="/" variant="secondary">
              Back to the store
            </Button>
          }
        />
      </Container>
    );
  }

  const plans = product.plans;
  const isMultiPlan = plans.length > 1;
  const selectedPlan = plans[selectedPlanIndex] || plans[0];
  const productInStock = isProductInStock(product);
  const isSelectedPlanAvailable = productInStock && isPlanAvailable(selectedPlan);
  const { price: displayPrice, strike: displayStrike, discountPct } = getPlanPricing(selectedPlan);
  const discount = discountPct || 0;
  const inrAmount = convertUsdToInr(selectedPlan.price);
  const inrDisplay = inrAmount !== null ? `₹${formatINR(inrAmount)}` : null;
  const perMonth = monthlyPrice(selectedPlan);
  const maker = product.brand || product.category;
  const meta = [product.category, "Digital delivery", isMultiPlan ? `${plans.length} plans` : formatPlanDuration(plans[0])].filter(Boolean);

  return (
    <div className="pdp">
      <Container>
        <nav className="pdp-breadcrumb" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          {product.category && (
            <>
              <LuChevronRight aria-hidden="true" />
              <Link to={`/?category=${encodeURIComponent(product.category)}`}>{product.category}</Link>
            </>
          )}
          <LuChevronRight aria-hidden="true" />
          <span aria-current="page" className="pdp-breadcrumb__current">
            {product.name}
          </span>
        </nav>

        <div className="pdp-main">
          <div className="pdp-media">
            <div className="pdp-media__frame" style={{ "--tint": categoryTint(product.category) }}>
              <ProductImage src={product.image} alt={product.name} name={product.name} loading="eager" />
            </div>
          </div>

          <div className="pdp-info">
            <div className="pdp-heading">
              {maker && <p className="pdp-maker">{maker}</p>}
              <h1 className={`pdp-title${(product.name || "").length > 48 ? " pdp-title--long" : ""}`}>{product.name}</h1>
              <p className="pdp-meta">{meta.join(" · ")}</p>
            </div>

            {isSelectedPlanAvailable ? (
              <div className="pdp-price-block">
                <div className="pdp-price">
                  <Price amount={displayPrice} strike={displayStrike} size="xl" />
                  {discount ? <span className="deal-tag">Save {discount}%</span> : null}
                </div>
                <p className="pdp-price__note">
                  {formatPlanDuration(selectedPlan)}
                  {perMonth !== null ? ` · ${formatUSD(perMonth)} per month` : ""}
                  {inrDisplay && (
                    <>
                      {" · You'll pay "}
                      <strong className="ui-num">{inrDisplay}</strong>
                      {" by UPI"}
                    </>
                  )}
                </p>
              </div>
            ) : (
              <Alert variant="danger">This product is out of stock right now.</Alert>
            )}

            <div ref={buyBtnAnchorRef} className="pdp-buy">
              {isMultiPlan && (
                <PlanSelector plans={plans} selectedIndex={selectedPlanIndex} onSelect={selectPlan} />
              )}

              <div className="pdp-actions">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleBuyNowClick}
                  disabled={!isSelectedPlanAvailable}
                  iconRight={isSelectedPlanAvailable ? <LuArrowRight /> : null}
                >
                  {isSelectedPlanAvailable ? `Buy now — ${displayPrice}` : "Out of stock"}
                </Button>
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={handleAddToCart}
                  disabled={!isSelectedPlanAvailable}
                  icon={<LuShoppingCart />}
                >
                  Add to cart
                </Button>
              </div>
              {cartNotice && (
                <Alert variant={cartNotice.variant}>
                  {cartNotice.text}{" "}
                  <Link to="/cart" className="ui-link">
                    View cart
                  </Link>
                </Alert>
              )}
            </div>

            <dl className="pdp-expect">
              {expectations.map(({ term, text, Icon }) => (
                <div key={term}>
                  <dt>
                    <Icon aria-hidden="true" />
                    {term}
                  </dt>
                  <dd>{text}</dd>
                </div>
              ))}
            </dl>

            <button type="button" className="pdp-proofs-link" onClick={scrollToProofs}>
              See delivery proof <LuArrowDown aria-hidden="true" />
            </button>
          </div>
        </div>
      </Container>

      <Section bordered className="pdp-section">
        <div className="pdp-details">
          <div className="pdp-details__main">
            <h2 className="pdp-section-title">What's included</h2>
            {product.description ? (
              <SafeHtml className="pdp-description" html={product.description} />
            ) : (
              <p className="ui-subtle">No description available for this product yet.</p>
            )}
          </div>
          <aside className="pdp-details__side" aria-labelledby="pdp-steps-title">
            <h2 id="pdp-steps-title" className="pdp-section-title">
              How buying works
            </h2>
            <ol className="pdp-steps">
              {purchaseSteps.map((step, i) => (
                <li className="pdp-step" key={step.title}>
                  <span className="pdp-step__num">{i + 1}</span>
                  <div>
                    <h3>{step.title}</h3>
                    <p>{step.desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </aside>
        </div>
      </Section>

      <ProofsGallery
        ref={proofsSectionRef}
        proofs={proofImages}
        hidden={proofsHidden}
        onToggleHidden={() => setProofsHidden((h) => !h)}
      />

      <Section bordered className="pdp-section">
        <div className="pdp-faq">
          <h2 className="pdp-section-title">Questions about buying</h2>
          <Accordion items={faqItems} idPrefix="pdp-faq" />
        </div>
      </Section>

      {showStickyBar && (
        <div className="buy-bar">
          <div className="ui-container buy-bar__inner">
            <div className="buy-bar__info">
              <span className="buy-bar__name">
                {product.name}
                {isMultiPlan ? ` — ${formatPlanDuration(selectedPlan)}` : ""}
              </span>
              {isSelectedPlanAvailable ? (
                <Price amount={displayPrice} strike={displayStrike} size="sm" />
              ) : (
                <span className="buy-bar__soldout">Out of stock</span>
              )}
            </div>
            <Button
              variant="primary"
              onClick={handleBuyNowClick}
              disabled={!isSelectedPlanAvailable}
              iconRight={isSelectedPlanAvailable ? <LuArrowRight /> : null}
            >
              {isSelectedPlanAvailable ? "Buy now" : "Sold out"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductPage;
