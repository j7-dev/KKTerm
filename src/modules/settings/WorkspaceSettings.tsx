import { useEffect, useState } from "react";
import { SquareStack } from "lucide-react";
import { useTranslation } from "react-i18next";
import { invokeCommand, isTauriRuntime } from "../../lib/tauri";
import { useWorkspaceStore } from "../../store";
import type { GeneralSettings } from "../../types";
import { SettingsSectionHeader, useSettingsSaveRegistration } from "./shared";
import { ToggleSwitch } from "./ToggleSwitch";

export function WorkspaceSettings() {
  const { t } = useTranslation();
  const generalSettings = useWorkspaceStore((state) => state.generalSettings);
  const setGeneralSettings = useWorkspaceStore((state) => state.setGeneralSettings);
  const showStatusBarNotice = useWorkspaceStore((state) => state.showStatusBarNotice);
  const [draft, setDraft] = useState<GeneralSettings>(generalSettings);
  const hasChanges =
    draft.hideTopTabButtons !== generalSettings.hideTopTabButtons ||
    draft.submitAiAttachmentsDirectly !== generalSettings.submitAiAttachmentsDirectly ||
    draft.separateSplitTerminalBackgrounds !== generalSettings.separateSplitTerminalBackgrounds;

  useEffect(() => {
    setDraft(generalSettings);
  }, [generalSettings]);

  async function handleSave() {
    try {
      const currentSettings = useWorkspaceStore.getState().generalSettings;
      const request = {
        ...currentSettings,
        hideTopTabButtons: draft.hideTopTabButtons,
        separateSplitTerminalBackgrounds: draft.separateSplitTerminalBackgrounds,
        submitAiAttachmentsDirectly: draft.submitAiAttachmentsDirectly,
      };
      const saved = isTauriRuntime()
        ? await invokeCommand("update_general_settings", { request })
        : request;
      setGeneralSettings(saved);
      setDraft(saved);
      showStatusBarNotice(t("settings.workspaceSaved"), { tone: "success" });
    } catch (saveError) {
      showStatusBarNotice(
        saveError instanceof Error ? saveError.message : String(saveError),
        { tone: "error" },
      );
    }
  }

  useSettingsSaveRegistration({ hasChanges, onSave: handleSave });

  return (
    <section className="settings-card settings-section">
      <SettingsSectionHeader
        icon={<SquareStack size={18} />}
        label={t("settings.sectionWorkspace")}
        title={t("settings.sectionWorkspace")}
      />
      <fieldset className="settings-subsection settings-fieldset">
        <legend>{t("settings.workspaceTabs")}</legend>
        <div className="settings-toggle-list">
          <label className="settings-toggle-row">
            <ToggleSwitch
              checked={draft.hideTopTabButtons}
              onChange={(checked) => setDraft((state) => ({ ...state, hideTopTabButtons: checked }))}
            />
            <span>
              <strong>{t("settings.hideTopTabButtons")}</strong>
              <small>{t("settings.hideTopTabButtonsDesc")}</small>
            </span>
          </label>
        </div>
      </fieldset>

      <fieldset className="settings-subsection settings-fieldset">
        <legend>{t("settings.sectionAiAssistant")}</legend>
        <div className="settings-toggle-list">
          <label className="settings-toggle-row">
            <ToggleSwitch
              checked={draft.submitAiAttachmentsDirectly}
              onChange={(checked) =>
                setDraft((state) => ({ ...state, submitAiAttachmentsDirectly: checked }))
              }
            />
            <span>
              <strong>{t("settings.submitAiAttachmentsDirectly")}</strong>
              <small>{t("settings.submitAiAttachmentsDirectlyDesc")}</small>
            </span>
          </label>
        </div>
      </fieldset>

      <fieldset className="settings-subsection settings-fieldset">
        <legend>{t("settings.terminalBackgrounds")}</legend>
        <div className="settings-toggle-list">
          <label className="settings-toggle-row">
            <ToggleSwitch
              checked={draft.separateSplitTerminalBackgrounds}
              onChange={(checked) =>
                setDraft((state) => ({ ...state, separateSplitTerminalBackgrounds: checked }))
              }
            />
            <span>
              <strong>{t("settings.separateSplitTerminalBackgrounds")}</strong>
              <small>{t("settings.separateSplitTerminalBackgroundsDesc")}</small>
            </span>
          </label>
        </div>
      </fieldset>
    </section>
  );
}
