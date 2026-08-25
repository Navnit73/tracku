import Swal from "sweetalert2";

// Configure SweetAlert2 for Expenseliy design system aesthetic
const CustomSwal = Swal.mixin({
  customClass: {
    popup: "!font-sans !border !border-hairline !rounded-3xl !bg-surface !text-ink !shadow-2xl !p-5 sm:!p-6",
    title: "!text-base sm:!text-lg !font-bold !text-ink !tracking-tight",
    htmlContainer: "!text-xs sm:!text-sm !text-ink-muted !leading-relaxed",
    actions: "!w-full !flex !flex-col-reverse sm:!flex-row !items-stretch sm:!items-center !justify-center !gap-2.5 sm:!gap-3 !mt-5 !mx-0",
    confirmButton: "!w-full sm:!w-auto !min-h-[44px] !bg-primary hover:!bg-primary-active !text-white !text-xs sm:!text-sm !font-bold !px-5 !py-2.5 !rounded-xl !transition-all active:!scale-95 !cursor-pointer !flex !items-center !justify-center !shadow-xs !m-0",
    cancelButton: "!w-full sm:!w-auto !min-h-[44px] !bg-canvas hover:!bg-hairline !text-ink !text-xs sm:!text-sm !font-bold !px-5 !py-2.5 !rounded-xl !border !border-hairline !transition-all active:!scale-95 !cursor-pointer !flex !items-center !justify-center !shadow-xs !m-0",
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

export interface ConfirmDialogOptions {
  title: string;
  text: string;
  confirmText?: string;
  cancelText?: string;
  confirmPhrase?: string;
  inputPlaceholder?: string;
  isDanger?: boolean;
  icon?: "warning" | "info" | "question" | "error" | "success";
}

export const confirmDialog = async (options: ConfirmDialogOptions): Promise<boolean> => {
  const isDanger = options.isDanger ?? true;
  const swalConfig: any = {
    title: options.title,
    text: options.text,
    icon: options.icon || (isDanger ? "warning" : "question"),
    showCancelButton: true,
    confirmButtonText: options.confirmText || (isDanger ? "Yes, proceed" : "Confirm"),
    cancelButtonText: options.cancelText || "Cancel",
    reverseButtons: true,
    iconColor: isDanger ? "var(--expense)" : "var(--primary)",
    customClass: {
      popup: "!font-sans !border !border-hairline !rounded-3xl !shadow-2xl !bg-surface !text-ink !p-5 sm:!p-6",
      title: "!text-base sm:!text-lg !font-bold !text-ink !tracking-tight",
      htmlContainer: "!text-xs sm:!text-sm !text-ink-muted !leading-relaxed !mt-1",
      input: "!mt-4 !mx-auto !w-[90%] !px-3.5 !py-2.5 !text-sm !font-mono !bg-canvas !text-ink !border !border-hairline !rounded-xl focus:!outline-none focus:!border-primary",
      validationMessage: "!bg-expense-bg !text-expense !text-xs !border !border-expense-border !rounded-lg !py-1.5 !px-3 !mx-auto !mt-2",
      actions: "!w-full !flex !flex-col-reverse sm:!flex-row !items-stretch sm:!items-center !justify-center !gap-2.5 sm:!gap-3 !mt-5 !mx-0",
      confirmButton: isDanger
        ? "!w-full sm:!w-auto !min-h-[44px] !bg-expense hover:!opacity-90 !text-white !text-xs sm:!text-sm !font-bold !px-5 !py-2.5 !rounded-xl !transition-all active:!scale-95 !cursor-pointer !flex !items-center !justify-center !shadow-xs !m-0"
        : "!w-full sm:!w-auto !min-h-[44px] !bg-primary hover:!bg-primary-active !text-white !text-xs sm:!text-sm !font-bold !px-5 !py-2.5 !rounded-xl !transition-all active:!scale-95 !cursor-pointer !flex !items-center !justify-center !shadow-xs !m-0",
      cancelButton: "!w-full sm:!w-auto !min-h-[44px] !bg-canvas hover:!bg-hairline !text-ink !text-xs sm:!text-sm !font-bold !px-5 !py-2.5 !rounded-xl !border !border-hairline !transition-all active:!scale-95 !cursor-pointer !flex !items-center !justify-center !shadow-xs !m-0",
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

