import React, { createContext, useContext, ReactNode, useState } from "react";
import axios from "axios";

import { flattenFirestoreFields } from "../api/firestore";

interface WorkOrderContextType {
  workOrders: workOrder[];
  loadWorkOrders: (
    pagesize?: number,
    pageToken?: string,
  ) => workOrder[] | Promise<workOrder[]>;
  loadWorkOrder: (workOrderId: string) => WorkOrder | Promise<workOrder | null>;
  findWorkOrder: (workOrderId: string) => workOrder | null;
  addWorkOrder: (workOrder: workOrder) => void;
  updateWorkOrder: (workOrder: workOrder) => void;
  deleteWorkOrder: (workOrderId: string) => void;
}

const AppContext = createContext<WorkOrderContextType>({
  workOrders: [],
  loadWorkOrders: async () => [],
  loadWorkOrder: async () => null,
  findWorkOrder: () => null,
  addWorkOrder: () => {},
  updateWorkOrder: () => {},
  deleteWorkOrder: () => {},
});

export const WorkOrderProvider = ({ children }: WorkOrderProviderProps) => {
  const [workOrders, setWorkOrders] = useState<workOrder[]>([]);
  const [pageNextToken, setNextToken] = useState<string | undefined>(undefined);

  const loadWorkOrders = async (pagesize?: number, pageToken?: string) => {
    try {
      const workOrders = await axios
        .get<
          workOrder[]
        >("https://firestore.googleapis.com/v1/projects/ant-its001/databases/(default)/documents/workorder", { params: { pagesize, pageToken } })
        .then((response) => {
          const workOrders = response.data.documents.map((doc) =>
            flattenFirestoreFields(doc.name, doc.fields),
          );
          setNextToken(response.data.nextPageToken);
          setWorkOrders(workOrders);
        });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("Error fetching document:", error.message);
        if (error.response) {
          console.error("Response data:", error.response.data);
          console.error("Response status:", error.response.status);
        }
      } else {
        console.error("An unexpected error occurred:", error);
      }
      setNextToken(undefined);
      setWorkOrders([]);
    }
  };
  const loadWorkOrder = async (workOrderId: string) => {
    try {
      const workOrder = await axios
        .get<workOrder>(
          `https://firestore.googleapis.com/v1/projects/ant-its001/databases/(default)/documents/workorder/${workOrderId}`,
        )
        .then((response) => {
          const workOrder = flattenFirestoreFields(
            response.data.name,
            response.data.fields,
          );
          return workOrder;
        });
      return workOrder;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("Error fetching document:", error.message);
        if (error.response) {
          console.error("Response data:", error.response.data);
          console.error("Response status:", error.response.status);
        }
      } else {
        console.error("An unexpected error occurred:", error);
      }
      return null;
    }
  };
  const findWorkOrder = (workOrderId: string) => {
    return workOrders.find((wo) => wo.id === workOrderId);
  };
  const addWorkOrder = (workOrder: workOrder) => {};
  const updateWorkOrder = (workOrder: workOrder) => {};
  const deleteWorkOrder = (workOrderId: string) => {};

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
