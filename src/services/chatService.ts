import vi from "./chatbot-intents.vi.json";
import en from "./chatbot-intents.en.json";
import { localize, type Lang } from "../refolks/data";

export type ChatStage = "idle" | "gender" | "laptop";
export type ChatReply = {text:string; href?:string; stage:ChatStage; gender?:"women"|"men"};
export const chatCopy = {vi,en};
const normalize = (value:string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
const wait = (ms:number) => new Promise((resolve)=>setTimeout(resolve,ms));

export async function answerChat(lang:Lang,input:string,stage:ChatStage,gender?:"women"|"men"):Promise<ChatReply>{
  await wait(350);
  const c=lang==="vi" ? chatCopy.vi : lang==="en" ? chatCopy.en : localize(chatCopy.en,lang); const q=normalize(input);
  if(stage==="gender") {
    const picked=/(^|\s)(nam|men|male)(\s|$)/.test(q)?"men":"women";
    return {text:c.askLaptop,stage:"laptop",gender:picked};
  }
  if(stage==="laptop") {
    const laptop=q.includes("laptop")||q.includes("work")||q.includes("lam viec")||q.includes("may tinh");
    const key=`${gender||"women"}${laptop?"Laptop":"Light"}` as "womenLaptop"|"womenLight"|"menLaptop"|"menLight";
    return {text:c[key],href:`/products/${gender==="men"?(laptop?"the-curator":"the-navigator"):(laptop?"the-herald":"the-navigator")}`,stage:"idle"};
  }
  if(q.includes("chon tui")||q.includes("choose a bag")||q.includes("tu van")) return {text:c.askGender,stage:"gender"};
  if(q.includes("gia")||q.includes("price")||q.includes("voucher")||q.includes("offer")||q.includes("khuyen mai")) return {text:c.price,href:"/shop",stage:"idle"};
  if(q.includes("quyen gop")||q.includes("donat")||q.includes("clothing")) return {text:c.donation,href:"/community#donation",stage:"idle"};
  if(q.includes("workshop")||q.includes("su kien")||q.includes("event")) return {text:c.workshop,href:"/community#events",stage:"idle"};
  if(q.includes("bao quan")||q.includes("care")||q.includes("clean")||q.includes("duong")) return {text:c.care,href:"/huong-dan-bao-quan",stage:"idle"};
  return {text:c.fallback,stage:"idle"};
}
