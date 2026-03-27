import { useInfiniteQuery, useMutation, useQuery } from '@tanstack/react-query';
import { fetchPaymentTransactionById, fetchPaymentTransactions, fetchReceipt } from '../api/payments.api';

export const useInfinitePaymentTransactions = (
    search: string,
    pageSize = 20
) => {
    return useInfiniteQuery({
        queryKey: ['payment-transactions', search],
        initialPageParam: 1,

        queryFn: ({ pageParam }) =>
            fetchPaymentTransactions(pageParam, pageSize, search),

        getNextPageParam: (lastPage, allPages) => {
            if (!lastPage.next) return undefined;
            return allPages.length + 1;
        },
    });
};

export const usePaymentTransactionDetails = (uid: string) => {
    return useQuery({
        queryKey: ['payment-transaction', uid],
        queryFn: () => fetchPaymentTransactionById(uid),
        enabled: !!uid,
    });
};

export const useDownloadReceipt = () => {
    return useMutation({
        mutationFn: (transactionId: string) => fetchReceipt(transactionId),
    });
};
