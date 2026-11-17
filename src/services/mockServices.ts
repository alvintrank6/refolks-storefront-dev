// Demo service boundary. Replace these functions with HTTP calls when a backend is ready.
const latency = () => 300 + Math.floor(Math.random() * 301);
const wait = () => new Promise<void>((resolve) => setTimeout(resolve, latency()));
const append = (key:string,record:Record<string,unknown>) => {
  const current = JSON.parse(localStorage.getItem(key) || "[]") as Record<string,unknown>[];
  localStorage.setItem(key, JSON.stringify([record,...current]));
};
export const authService = {
  async register(name:string,email:string) { await wait(); const user={name,email};localStorage.setItem("refolks-account",JSON.stringify(user));return user; },
  async signIn(name:string,email:string) { await wait(); const user={name,email};localStorage.setItem("refolks-account",JSON.stringify(user));return user; }
};
export const formService = {
  async donation(data:Record<string,unknown>) { await wait();append("refolks-service-donations",{...data,createdAt:new Date().toISOString()});return {voucher:"DONATE15"}; },
  async event(data:Record<string,unknown>) { await wait();append("refolks-service-events",{...data,createdAt:new Date().toISOString()});return {ok:true}; },
  async care(data:Record<string,unknown>) { await wait();append("refolks-service-care",{...data,createdAt:new Date().toISOString()});return {ok:true}; },
  async newsletter(email:string) { await wait();append("refolks-service-newsletter",{email,createdAt:new Date().toISOString()});return {ok:true}; }
};
export const orderService = {
  async place(order:Record<string,unknown>) { await wait();append("refolks-service-orders",order);return {ok:true}; }
};
