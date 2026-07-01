ALTER TABLE "customer_reviews"
  ADD CONSTRAINT "rating_range_check" CHECK ("rating" >= 1 AND "rating" <= 5);