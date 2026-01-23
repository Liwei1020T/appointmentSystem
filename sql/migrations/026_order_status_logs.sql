CREATE TABLE order_status_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  note TEXT,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_order_status_logs_order_id ON order_status_logs(order_id);

ALTER TABLE orders
ADD COLUMN last_status_change_at timestamptz DEFAULT now();
