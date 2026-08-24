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
  confirmPhrase?: string;
  inputPlaceholder?: string;
}): Promise<boolean> => {
  const swalConfig: any = {
    title: options.title,
    text: options.text,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: options.confirmText || "Yes, delete",
    cancelButtonText: options.cancelText || "Cancel",
    reverseButtons: true,
    iconColor: "var(--expense)",
    customClass: {
      popup: "font-sans border border-hairline rounded-2xl shadow-xl bg-surface text-ink p-6",
      title: "text-lg font-bold text-ink tracking-tight",
      htmlContainer: "text-sm text-ink-muted leading-relaxed",
      input: "!mt-4 !mx-auto !w-[88%] !px-3.5 !py-2.5 !text-sm !font-mono !bg-canvas !text-ink !border !border-hairline !rounded-xl focus:!outline-none focus:!border-primary",
      validationMessage: "!bg-expense-bg !text-expense !text-xs !border !border-expense-border !rounded-lg !py-1.5 !px-3 !mx-auto !mt-2",
      confirmButton: "bg-expense hover:opacity-90 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all shadow-sm cursor-pointer",
      cancelButton: "bg-canvas hover:bg-hairline text-ink text-sm font-semibold px-4 py-2 rounded-xl border border-hairline transition-all ml-2 cursor-pointer",
    },
  };

  if (options.confirmPhrase) {
    swalConfig.input = "text";
    swalConfig.inputPlaceholder = options.inputPlaceholder || `Type "${options.confirmPhrase}" to confirm`;
    swalConfig.inputAttributes = {
      autocapitalize: "off",
      autocorrect: "off",
      spellcheck: "false",
      autocomplete: "off",
    };
    swalConfig.inputValidator = (value: string) => {
      if (!value || value.trim().toLowerCase() !== options.confirmPhrase?.toLowerCase()) {
        return `Please type "${options.confirmPhrase}" to confirm.`;
      }
      return null;
    };
  }

  const result = await CustomSwal.fire(swalConfig);
  return result.isConfirmed;
};

export default CustomSwal;
