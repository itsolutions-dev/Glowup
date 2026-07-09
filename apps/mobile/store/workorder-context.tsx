import React, { createContext, useContext, ReactNode, useState } from "react";
import axios from "axios";

import {
  flattenFirestoreFields,
  FirestoreDocument,
  FlattenedDocument,
} from "../api/firestore";

export interface WorkOrder extends FlattenedDocument {
  id: string;
}

interface WorkOrderListResponse {
  documents?: FirestoreDocument[];
  nextPageToken?: string;
}

interface WorkOrderContextType {
  workOrders: WorkOrder[];
  loadWorkOrders: (
    pagesize?: number,
    pageToken?: string,
  ) => Promise<WorkOrder[]>;
  loadWorkOrder: (workOrderId: string) => Promise<WorkOrder | null>;
  findWorkOrder: (workOrderId: string) => WorkOrder | null;
  addWorkOrder: (workOrder: WorkOrder) => void;
  updateWorkOrder: (workOrder: WorkOrder) => void;
  deleteWorkOrder: (workOrderId: string) => void;
}

interface WorkOrderProviderProps {
  children: ReactNode;
}

const BASE_URL =
  "https://firestore.googleapis.com/v1/projects/ant-its001/databases/(default)/documents/workorder";

const AppContext = createContext<WorkOrderContextType>({
  workOrders: [],
  loadWorkOrders: async () => [],
  loadWorkOrder: async () => null,
  findWorkOrder: () => null,
  addWorkOrder: () => {},
  updateWorkOrder: () => {},
  deleteWorkOrder: () => {},
});

const logAxiosError = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    console.error("Error fetching document:", error.message);
    if (error.response) {
      console.error("Response data:", error.response.data);
      console.error("Response status:", error.response.status);
    }
  } else {
    console.error("An unexpected error occurred:", error);
  }
};

export const WorkOrderProvider = ({ children }: WorkOrderProviderProps) => {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [, setNextToken] = useState<string | undefined>(undefined);

  const loadWorkOrders = async (pagesize?: number, pageToken?: string) => {
    try {
      const response = await axios.get<WorkOrderListResponse>(BASE_URL, {
        params: { pagesize, pageToken },
      });
      const loaded = (response.data.documents ?? []).map(
        (doc) => flattenFirestoreFields(doc.name, doc.fields) as WorkOrder,
      );
      setNextToken(response.data.nextPageToken);
      setWorkOrders(loaded);
      return loaded;
    } catch (error) {
      logAxiosError(error);
      setNextToken(undefined);
      setWorkOrders([]);
      return [];
    }
  };

  const loadWorkOrder = async (workOrderId: string) => {
    try {
      const response = await axios.get<FirestoreDocument>(
        `${BASE_URL}/${workOrderId}`,
      );
      return flattenFirestoreFields(
        response.data.name,
        response.data.fields,
      ) as WorkOrder;
    } catch (error) {
      logAxiosError(error);
      return null;
    }
  };

  const findWorkOrder = (workOrderId: string) => {
    return workOrders.find((wo) => wo.id === workOrderId) ?? null;
  };

  const addWorkOrder = (_workOrder: WorkOrder) => {};
  const updateWorkOrder = (_workOrder: WorkOrder) => {};
  const deleteWorkOrder = (_workOrderId: string) => {};

  const value: WorkOrderContextType = {
    workOrders,
    loadWorkOrders,
    loadWorkOrder,
    findWorkOrder,
    addWorkOrder,
    updateWorkOrder,
    deleteWorkOrder,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useWorkOrderContext = () => {
  return useContext(AppContext);
};
