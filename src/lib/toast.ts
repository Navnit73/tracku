import Swal from "sweetalert2";

// Configure SweetAlert2 for Notion design system aesthetic
const CustomSwal = Swal.mixin({
  customClass: {
    popup: "font-sans border border-hairline rounded-xl shadow-lg bg-surface text-ink",
    title: "text-lg font-bold text-ink",
    htmlContainer: "text-sm text-ink-muted",
    confirmButton: "bg-primary hover:bg-primary-active text-white text-sm font-medium px-4 py-2 rounded-lg transition-all",
    cancelButton: "bg-canvas hover:bg-hairline text-ink text-sm font-medium px-4 py-2 rounded-lg border border-hairline transition-all ml-2",
  },
  buttonsStyling: false,
});

export const showToast = {
  success: (title: string, message?: string) => {
    CustomSwal.fire({
      toast: true,
      position: "top-end",
      icon: "success",
      title: title,
      text: message,
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      iconColor: "var(--income)",
    });
  },
  error: (title: string, message?: string) => {
    CustomSwal.fire({
      toast: true,
      position: "top-end",
      icon: "error",
      title: title,
      text: message,
      showConfirmButton: false,
      timer: 4000,
      timerProgressBar: true,
      iconColor: "var(--expense)",
    });
  },
  info: (title: string, message?: string) => {
    CustomSwal.fire({
      toast: true,
      position: "top-end",
      icon: "info",
      title: title,
      text: message,
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      iconColor: "var(--primary)",
    });
  },
  warning: (title: string, message?: string) => {
    CustomSwal.fire({
      toast: true,
      position: "top-end",
      icon: "warning",
      title: title,
      text: message,
      showConfirmButton: false,
      timer: 3500,
      timerProgressBar: true,
      iconColor: "var(--warning)",
    });
  },
};

export const confirmDialog = async (options: {
  title: string;
  text: string;
  confirmText?: string;
  cancelText?: string;
}): Promise<boolean> => {
  const result = await CustomSwal.fire({
    title: options.title,
    text: options.text,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: options.confirmText || "Yes, delete",
    cancelButtonText: options.cancelText || "Cancel",
    reverseButtons: true,
    iconColor: "var(--expense)",
  });
  return result.isConfirmed;
};

export default CustomSwal;
