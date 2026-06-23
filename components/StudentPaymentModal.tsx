import { updateStudentPaymentStatus } from "@/database/Students";
import { forwardRef, useCallback, useImperativeHandle, useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";

export const FEE_AMOUNT = 150;

export type PaymentStudent = {
  id: number;
  name: string;
  is_paid: number;
};

export type StudentPaymentModalRef = {
  open: (student: PaymentStudent) => void;
};

export function formatRs(amount: number) {
  return `Rs. ${amount.toLocaleString("en-IN")}`;
}

type StudentPaymentModalProps = {
  className: string;
  onPaymentUpdated: () => void | Promise<void>;
};

export const StudentPaymentModal = forwardRef<
  StudentPaymentModalRef,
  StudentPaymentModalProps
>(function StudentPaymentModal({ className, onPaymentUpdated }, ref) {
  const [visible, setVisible] = useState(false);
  const [student, setStudent] = useState<PaymentStudent | null>(null);

  const close = useCallback(() => {
    setVisible(false);
    setStudent(null);
  }, []);

  const open = useCallback((item: PaymentStudent) => {
    setStudent(item);
    setVisible(true);
  }, []);

  useImperativeHandle(ref, () => ({ open }), [open]);

  const handleTogglePayment = useCallback(async () => {
    if (!student) return;

    const nextPaid = student.is_paid !== 1;
    await updateStudentPaymentStatus(student.id, nextPaid);
    close();
    await onPaymentUpdated();
  }, [close, onPaymentUpdated, student]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={close}
    >
      <Pressable
        className="flex-1 items-center justify-center bg-black/40 px-6"
        onPress={close}
      >
        <Pressable
          className="w-full max-w-sm rounded-2xl bg-white p-5"
          onPress={(e) => e.stopPropagation()}
        >
          <Text className="text-lg font-semibold text-gray-900">Payment</Text>

          {student && (
            <View className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
              <Text className="text-base font-semibold text-gray-900">
                {student.name}
              </Text>
              <Text className="mt-1 text-sm text-gray-600">
                Class: {className}
              </Text>
              <Text className="mt-3 text-sm font-medium text-gray-500">
                Outstanding amount
              </Text>
              <Text className="mt-0.5 text-xl font-bold text-amber-700">
                {formatRs(FEE_AMOUNT)}
              </Text>
            </View>
          )}

          <View className="mt-5 flex-row justify-end gap-2">
            <Pressable
              onPress={close}
              className="rounded-lg px-4 py-2 active:opacity-70"
            >
              <Text className="text-base font-medium text-gray-600">Cancel</Text>
            </Pressable>
            {student && (
              <Pressable
                onPress={handleTogglePayment}
                className={`rounded-lg px-4 py-2 active:opacity-80 ${
                  student.is_paid === 1 ? "bg-red-600" : "bg-green-600"
                }`}
              >
                <Text className="text-base font-semibold text-white">
                  {student.is_paid === 1 ? "Mark Unpaid" : "Mark Paid"}
                </Text>
              </Pressable>
            )}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
});
