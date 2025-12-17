-- Create reviews table to align database with Prisma schema
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL,
    user_id UUID NOT NULL,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    photos TEXT[],
    created_at TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_reviews_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    CONSTRAINT fk_reviews_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_order_id ON reviews(order_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at);

CREATE TRIGGER IF NOT EXISTS update_reviews_updated_at BEFORE UPDATE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
