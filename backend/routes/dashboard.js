const express = require('express');
const { pool } = require('../db/database');
const { authenticate, adminOnly } = require('../middleware/auth');
const router = express.Router();

const safe = async (label, sql, params = []) => {
  try {
    const { rows } = await pool.query(sql, params);
    return rows;
  } catch (err) {
    console.error(`Dashboard query failed [${label}]:`, err.message);
    return [];
  }
};

router.get('/stats', authenticate, adminOnly, async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'

    const [
      customers, orders, pendingOrd, deliveredOrd, totalRev,
      todayRev, monthRev, todayOrd,
      todayApptRows, pendingApptRows,
      recentOrders, recentCustomers, ordersByStatus,
      monthlySales, dailySales, topProducts,
      powerRanges, rxByAge, visionTypes,
    ] = await Promise.all([
      safe('totalCustomers',  "SELECT COUNT(*)::int as c FROM users WHERE role='customer'"),
      safe('totalOrders',     'SELECT COUNT(*)::int as c FROM orders'),
      safe('pendingOrders',   "SELECT COUNT(*)::int as c FROM orders WHERE status IN ('pending','processing','ready')"),
      safe('deliveredOrders', "SELECT COUNT(*)::int as c FROM orders WHERE status='delivered'"),
      safe('totalSales',      "SELECT COALESCE(SUM(total_amount),0)::float as t FROM orders WHERE status!='cancelled'"),
      safe('todaySales',      "SELECT COALESCE(SUM(total_amount),0)::float as t FROM orders WHERE status!='cancelled' AND created_at::date=CURRENT_DATE"),
      safe('monthSales',      "SELECT COALESCE(SUM(total_amount),0)::float as t FROM orders WHERE status!='cancelled' AND DATE_TRUNC('month',created_at)=DATE_TRUNC('month',NOW())"),
      safe('todayOrders',     'SELECT COUNT(*)::int as c FROM orders WHERE created_at::date=CURRENT_DATE'),
      safe('todayAppts',      "SELECT COUNT(*)::int as c FROM appointments WHERE date=$1 AND status!='cancelled'", [today]),
      safe('pendingAppts',    "SELECT COUNT(*)::int as c FROM appointments WHERE status='pending'"),
      safe('recentOrders',    `SELECT o.id,o.status,o.total_amount,o.created_at,u.name as customer_name
                                FROM orders o JOIN users u ON o.user_id=u.id ORDER BY o.created_at DESC LIMIT 8`),
      safe('recentCustomers', "SELECT id,title,name,email,phone,created_at FROM users WHERE role='customer' ORDER BY created_at DESC LIMIT 6"),
      safe('ordersByStatus',  'SELECT status,COUNT(*)::int as count FROM orders GROUP BY status'),
      safe('monthlySales',    `SELECT TO_CHAR(created_at,'YYYY-MM') as month,
                                COALESCE(SUM(total_amount),0)::float as total, COUNT(*)::int as orders
                                FROM orders WHERE status!='cancelled'
                                GROUP BY 1 ORDER BY 1 DESC LIMIT 12`),
      safe('dailySales',      `SELECT TO_CHAR(created_at,'YYYY-MM-DD') as day,
                                COALESCE(SUM(total_amount),0)::float as total, COUNT(*)::int as orders
                                FROM orders WHERE status!='cancelled' AND created_at >= NOW() - INTERVAL '30 days'
                                GROUP BY 1 ORDER BY 1 DESC`),
      safe('topProducts',     `SELECT oi.product_name, SUM(oi.quantity)::int as qty,
                                SUM(oi.price*oi.quantity)::float as revenue
                                FROM order_items oi GROUP BY oi.product_name ORDER BY qty DESC LIMIT 5`),
      safe('powerRanges',     `SELECT
                                CASE
                                  WHEN sph <= -6   THEN 'High Myopia (≤ -6)'
                                  WHEN sph <= -3   THEN 'Moderate Myopia (-6 to -3)'
                                  WHEN sph < -0.5  THEN 'Mild Myopia (-3 to -0.5)'
                                  WHEN sph <= 0.5  THEN 'Plano / Normal'
                                  WHEN sph <= 2    THEN 'Mild Hyperopia (+0.5 to +2)'
                                  ELSE                  'High Hyperopia (> +2)'
                                END as range,
                                COUNT(*)::int as count
                                FROM (
                                  SELECT CAST(NULLIF(TRIM(right_sph),'') AS FLOAT) as sph FROM prescriptions WHERE right_sph IS NOT NULL AND right_sph!=''
                                  UNION ALL
                                  SELECT CAST(NULLIF(TRIM(left_sph), '') AS FLOAT) as sph FROM prescriptions WHERE left_sph IS NOT NULL AND left_sph!=''
                                ) t WHERE sph IS NOT NULL
                                GROUP BY 1 ORDER BY count DESC`),
      safe('rxByAge',         `SELECT
                                CASE
                                  WHEN u.age BETWEEN 0  AND 12 THEN '0-12 (Children)'
                                  WHEN u.age BETWEEN 13 AND 19 THEN '13-19 (Teens)'
                                  WHEN u.age BETWEEN 20 AND 35 THEN '20-35 (Young Adults)'
                                  WHEN u.age BETWEEN 36 AND 50 THEN '36-50 (Adults)'
                                  WHEN u.age > 50              THEN '51+ (Seniors)'
                                END as age_group,
                                COUNT(p.id)::int as prescriptions,
                                COUNT(DISTINCT p.user_id)::int as patients
                                FROM prescriptions p
                                JOIN users u ON p.user_id=u.id
                                WHERE u.age IS NOT NULL
                                GROUP BY 1 ORDER BY MIN(u.age)`),
      safe('visionTypes',     `SELECT vision_type, COUNT(*)::int as count FROM prescriptions
                                WHERE vision_type IS NOT NULL GROUP BY vision_type ORDER BY count DESC`),
    ]);

    res.json({
      totalCustomers:  customers[0]?.c  ?? 0,
      totalOrders:     orders[0]?.c     ?? 0,
      pendingOrders:   pendingOrd[0]?.c ?? 0,
      deliveredOrders: deliveredOrd[0]?.c ?? 0,
      totalSales:      totalRev[0]?.t   ?? 0,
      todaySales:      todayRev[0]?.t   ?? 0,
      monthSales:      monthRev[0]?.t   ?? 0,
      todayOrders:     todayOrd[0]?.c   ?? 0,
      todayAppts:      todayApptRows[0]?.c   ?? 0,
      pendingAppts:    pendingApptRows[0]?.c ?? 0,
      recentOrders, recentCustomers, ordersByStatus,
      monthlySales, dailySales, topProducts,
      powerRanges, rxByAge, visionTypes,
    });
  } catch (err) {
    console.error('Dashboard stats error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
