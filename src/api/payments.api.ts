import { http } from './http';

export type PaymentTransaction = {
    uid: string;
    transaction_id: string;
    student_name: string;
    course_name: string;
    batch_name: string;
    amount: string;
    payment_method: string;
    payment_method_display: string;
    status: string;
    status_display: string;
    payment_date: string;
    created_at: string;
    metadata: {
        name: string | null;
    };
    student_id: string | null;
    counselor: string;
    pdf_file: string | null;
};

export type PaymentTransactionsResponse = {
    count: number;
    next: string | null;
    previous: string | null;
    results: PaymentTransaction[];
    access_control: {
        user_access_level: string;
        user_role: string;
        is_superuser: boolean;
        visible_role_count: string | number;
        total_accessible_transactions: number;
    };
};

export type PaymentTransactionDetail = {
    uid: string;
    transaction_id: string;
    enrollment: string;
    enrollment_details: {
        id: string;
        student_name: string;
        student_email: string;
        student_phone: string;
        course_name: string;
        batch_name: string;
        enrollment_date: string;
    } | null;
    emi_installment: string | null;
    emi_installment_details: any | null;
    payment_order: string | null;
    payment_order_details: any | null;
    amount: string;
    payment_method: string;
    payment_method_display: string;
    payment_gateway: string;
    reference_number: string;
    gateway_transaction_id: string;
    status: string;
    status_display: string;
    payment_date: string;
    counselor: number;
    counselor_details: {
        id: number;
        name: string;
        email: string;
    };
    received_by: number | null;
    received_by_details: any | null;
    verified_by: number | null;
    verified_by_details: any | null;
    notes: string;
    metadata: any;
    created_at: string;
    updated_at: string;
    student_id: string;
};

export type PaymentTransactionDetailResponse = {
    message: string;
    data: PaymentTransactionDetail;
};

export type ReceiptData = {
    uid: string;
    receipt_number: string;
    receipt_type: string;
    payment_category: string;
    admission_fee_amount: string;
    course_fee_amount: string;
    material_fee_amount: string;
    exam_fee_amount: string;
    late_fee_amount: string;
    discount_amount: string;
    emi_installment_number: number | null;
    emi_due_date: string | null;
    remaining_emi_count: number | null;
    remarks: string;
    printed_count: number;
    emailed_count: number;
    last_printed_at: string | null;
    last_emailed_at: string | null;
    pdf_file: string;
    created_at: string;
};

export type ReceiptResponse = {
    success: boolean;
    data: ReceiptData;
};

export const fetchPaymentTransactions = async (
    page: number,
    pageSize = 20,
    search = ''
): Promise<PaymentTransactionsResponse> => {
    const res = await http.get('/payment-transactions/', {
        params: {
            page,
            page_size: pageSize,
            search: search || undefined,
        },
    });

    return res.data;
};

export const fetchPaymentTransactionById = async (
    uid: string
): Promise<PaymentTransactionDetail> => {
    const res = await http.get<PaymentTransactionDetailResponse>(`/payment-transactions/${uid}/`);
    return res.data.data;
};

export const fetchReceipt = async (transactionId: string): Promise<ReceiptData> => {
    const res = await http.get<ReceiptResponse>(`/receipt/${transactionId}/`);
    return res.data.data;
};
