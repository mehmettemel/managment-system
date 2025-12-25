-- Create a function to atomically process a payment and its related commission
CREATE OR REPLACE FUNCTION process_payment_with_commission(
  p_payment_data jsonb,
  p_month_count int
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_payment_id bigint;
  v_class_id bigint;
  v_amount numeric;
  v_instructor_id bigint;
  v_instructor_commission_rate numeric;
  v_default_commission_rate numeric;
  v_final_rate numeric;
  v_total_commission numeric;
  v_monthly_commission numeric;
  v_created_payment jsonb;
  i int;
  v_base_date date;
  v_due_date date;
BEGIN
  -- 1. Insert Payment
  INSERT INTO payments (
    member_id,
    class_id,
    member_class_id,
    amount,
    payment_method,
    payment_date,
    period_start,
    period_end,
    description,
    snapshot_price,
    snapshot_class_name,
    payment_type
  ) VALUES (
    (p_payment_data->>'member_id')::bigint,
    (p_payment_data->>'class_id')::bigint,
    (p_payment_data->>'member_class_id')::bigint,
    (p_payment_data->>'amount')::numeric,
    p_payment_data->>'payment_method',
    (p_payment_data->>'payment_date')::date,
    (p_payment_data->>'period_start')::date,
    (p_payment_data->>'period_end')::date,
    p_payment_data->>'description',
    (p_payment_data->>'snapshot_price')::numeric,
    p_payment_data->>'snapshot_class_name',
    p_payment_data->>'payment_type'
  )
  RETURNING id, class_id, amount INTO v_payment_id, v_class_id, v_amount;
  
  -- Return full object for response
  SELECT to_jsonb(p) INTO v_created_payment FROM payments p WHERE id = v_payment_id;

  -- 2. Process Commission
  -- Get Class Info
  SELECT instructor_id, instructor_commission_rate 
  INTO v_instructor_id, v_instructor_commission_rate
  FROM classes WHERE id = v_class_id;

  IF v_instructor_id IS NOT NULL THEN
     -- Determine Rate
     v_final_rate := 0;
     
     -- Priority 1: Class specific rate
     IF v_instructor_commission_rate IS NOT NULL THEN
        v_final_rate := v_instructor_commission_rate;
     ELSE
        -- Priority 2: Instructor default rate
        SELECT default_commission_rate INTO v_default_commission_rate
        FROM instructors WHERE id = v_instructor_id;
        v_final_rate := COALESCE(v_default_commission_rate, 0);
     END IF;

     IF v_final_rate > 0 THEN
        v_total_commission := (v_amount * v_final_rate) / 100;
        -- If this single payment covers multiple months (unlikely for our monthly loop logic but flexible), split it.
        -- Usually p_month_count here refers to the split of commission installment?
        -- In actions/finance.ts processStudentPayment(paymentId, amount, monthsCount, ...)
        -- The monthsCount there was often 1 because we looped payments. 
        -- But IF we paid for 3 months in one Payment record? (Not currently done, we split records).
        -- We will respect the input p_month_count.
        
        v_monthly_commission := v_total_commission / GREATEST(p_month_count, 1);
        v_base_date := (p_payment_data->>'payment_date')::date;

        -- Insert Ledger Entries
        FOR i IN 0..(p_month_count - 1) LOOP
            v_due_date := v_base_date + (i || ' month')::interval;
            
            INSERT INTO instructor_ledger (
                instructor_id,
                student_payment_id,
                amount,
                due_date,
                status
            ) VALUES (
                v_instructor_id,
                v_payment_id,
                v_monthly_commission,
                v_due_date,
                'pending'
            );
        END LOOP;
     END IF;
  END IF;

  RETURN v_created_payment;
END;
$$;
