const express = require('express');
const { pool } = require('../db/database');
const { authenticate, adminOnly } = require('../middleware/auth');
const router = express.Router();

router.get('/stats', authenticate, adminOnly, async (req, res) => {
  try {
    const q = async (sql, params) => (await pool.query(sql, params)).rows;

    const [
      [{ c: totalCustomers }],
      [{ c: totalOrders }],
      [{ c: pendingOrders }],
      [{ c: deliveredOrders }],
      [{ t: totalSales }],
      [{ t: todaySales }],
      [{ t: monthSales }],
      [{ c: todayOrders }],
      [{ c: todayAppts }],
      [{ c: pendingAppts }],
      recentOrders,
      recentCustomers,
      ordersByStatus,
      monthlySales,
      dailySales,
      topProducts,
    ] = await Promise.all([
      q("SELECT COUNT(*)::int as c FROM users WHERE role='customer'"),
      q('SELECT COUNT(*)::int as c FROM orders'),
      q("SELECT COUNT(*)::int as c FROM orders WHERE status IN ('pending','processing','ready')"),
      q("SELECT COUNT(*)::int as c FROM orders WHERE status='delivered'"),
      q("SELECT COALESCE(SUM(total_amount),0)::float as t FROM orders WHERE status!='cancelled'"),
      q("SELECT COALESCE(SUM(total_amount),0)::float as t FROM orders WHERE status!='cancelled' AND DATE(created_at)=CURRENT_DATE"),
      q("SELECT COALESCE(SUM(total_amount),0)::float as t FROM orders WHERE status!='cancelled' AND DATE_TRUNC('month',created_at)=DATE_TRUNC('month',NOW())"),
      q("SELECT COUNT(*)::int as c FROM orders WHERE DATE(created_at)=CURRENT_DATE"),
      q("SELECT COUNT(*)::int as c FROM appointments WHERE date=CURRENT_DATE AND status!='cancelled'"),
      q("SELECT COUNT(*)::int as c FROM appointments WHERE status='pending'"),
      q(`SELECT o.id,o.status,o.total_amount,o.created_at,u.name as customer_name
         FROM orders o JOIN users u ON o.user_id=u.id ORDER BY o.created_at DESC LIMIT 8`),
      q("SELECT id,title,name,email,phone,created_at FROM users WHERE role='customer' ORDER BY created_at DESC LIMIT 6"),
      q('SELECT status,COUNT(*)::int as count FROM orders GROUP BY status'),
      q(`SELECT TO_CHAR(created_at,'YYYY-MM') as month, SUM(total_amount)::float as total, COUNT(*)::int as orders
         FROM orders WHERE status!='cancelled' GROUP BY month ORDER BY month DESC LIMIT 12`),
      q(`SELECT TO_CHAR(created_at,'YYYY-MM-DD') as day, COALESCE(SUM(total_amount),0)::float as total, COUNT(*)::int as orders
         FROM orders WHERE status!='cancelled' AND created_at >= NOW() - INTERVAL '30 days'
         GROUP BY day ORDER BY day DESC`),
      q(`SELECT oi.product_name, SUM(oi.quantity)::int as qty, SUM(oi.price*oi.quantity)::float as revenue
         FROM order_items oi GROUP BY oi.product_name ORDER BY qty DESC LIMIT 5`),
    ]);

    res.json({
      totalCustomers, totalOrders, pendingOrders, deliveredOrders, totalSales,
      todaySales, monthSales, todayOrders,
      todayAppts, pendingAppts,
      recentOrders, recentCustomers, ordersByStatus, monthlySales, dailySales, topProducts
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
