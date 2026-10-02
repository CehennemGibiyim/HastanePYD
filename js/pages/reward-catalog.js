// ===== ÖDÜL KATALOĞU İŞLEM SERVİSİ =====
export function redeemReward(reward, balance) {
  const cost = Number(reward?.cost || 0);
  if (!reward || cost <= 0) return { ok: false, reason: 'invalid' };
  if (Number(balance || 0) < cost) return { ok: false, reason: 'balance' };
  return { ok: true, remaining: Number(balance) - cost, orderId: `reward_${Date.now()}` };
}
