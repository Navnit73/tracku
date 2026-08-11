import Swal from "sweetalert2";

// Configure SweetAlert2 for Notion design system aesthetic
const CustomSwal = Swal.mixin({
  customClass: {
    popup: "font-sans border border-[#e6e6e6] dark:border-[#2f2f2f] rounded-xl shadow-lg bg-[#ffffff] dark:bg-[#202020] text-[#171717] dark:text-[#f7f7f7]",
    title: "text-lg font-bold text-[#171717] dark:text-[#f7f7f7]",
    htmlContainer: "text-sm text-[#615d59] dark:text-[#9b9b9b]",
    confirmButton: "bg-[#0075de] hover:bg-[#005bab] text-white text-sm font-medium px-4 py-2 rounded-lg shadow-sm transition-all",
    cancelButton: "bg-[#f6f5f4] dark:bg-[#2a2a2a] hover:bg-[#e6e6e6] dark:hover:bg-[#333333] text-[#171717] dark:text-[#f7f7f7] text-sm font-medium px-4 py-2 rounded-lg border border-[#e6e6e6] dark:border-[#2f2f2f] transition-all ml-2",
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
      iconColor: "#059669",
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
      iconColor: "#e11d48",
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
      iconColor: "#0075de",
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
      iconColor: "#d97706",
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
    iconColor: "#e11d48",
  });
  return result.isConfirmed;
};

export default CustomSwal;
