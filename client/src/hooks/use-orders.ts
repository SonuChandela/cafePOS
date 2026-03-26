import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type CreateOrderRequest, type OrderWithItems } from "@shared/schema";

export function useOrders() {
    return useQuery({
        queryKey: [api.orders.list.path],
        queryFn: async () => {
            const res = await fetch(api.orders.list.path);
            if (!res.ok) throw new Error("Failed to fetch orders");
            return api.orders.list.responses[200].parse(await res.json());
        },
    });
}

export function useOrder(id: number | null) {
    return useQuery({
        queryKey: [api.orders.get.path, id],
        enabled: !!id,
        queryFn: async () => {
            if (!id) return null;
            const url = buildUrl(api.orders.get.path, { id });
            const res = await fetch(url);
            if (!res.ok) {
                if (res.status === 404) return null;
                throw new Error("Failed to fetch order");
            }
            return api.orders.get.responses[200].parse(await res.json());
        },
    });
}

export function useCreateOrder() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: CreateOrderRequest) => {
            const res = await fetch(api.orders.create.path, {
                method: api.orders.create.method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (!res.ok) {
                if (res.status === 400) {
                    const error = api.orders.create.responses[400].parse(await res.json());
                    throw new Error(error.message);
                }
                throw new Error("Failed to create order");
            }
            return api.orders.create.responses[201].parse(await res.json());
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [api.orders.list.path] });
        },
    });
}
