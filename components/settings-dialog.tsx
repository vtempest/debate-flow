"use client"

import { useState, useEffect } from "react"
import { settings, settingsGroups } from "@/lib/settings"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import type { SliderSetting, RadioSetting } from "@/lib/types"

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const [settingsData, setSettingsData] = useState(settings.data)

  useEffect(() => {
    const unsubscribe = settings.subscribe(Object.keys(settings.data), () => {
      setSettingsData({ ...settings.data })
    })
    return unsubscribe
  }, [])

  const handleSliderChange = (key: string, value: number[]) => {
    settings.setValue(key, value[0])
    settings.saveToLocalStorage()
  }

  const handleToggleChange = (key: string, checked: boolean) => {
    settings.setValue(key, checked)
    settings.saveToLocalStorage()
  }

  const handleRadioChange = (key: string, value: string) => {
    const index = Number.parseInt(value)
    settings.setValue(key, index)
    settings.saveToLocalStorage()
  }

  const handleCustomOptionChange = (key: string, value: string) => {
    const setting = settings.data[key] as RadioSetting
    if (setting.type === "radio" && setting.detail.customOption) {
      setting.detail.customOptionValue = value
      settings.saveToLocalStorage()
      setSettingsData({ ...settings.data })
    }
  }

  const resetToDefaults = () => {
    settings.resetToAuto()
    settings.saveToLocalStorage()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {settingsGroups.map((group) => (
            <div key={group.name} className="space-y-4">
              <h3 className="text-lg font-semibold">{group.name}</h3>

              {group.settings.map((key) => {
                const setting = settingsData[key]

                if (setting.type === "toggle") {
                  return (
                    <div key={key} className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor={key}>{setting.name}</Label>
                        {setting.info && <p className="text-sm text-muted-foreground">{setting.info}</p>}
                      </div>
                      <Switch
                        id={key}
                        checked={setting.value as boolean}
                        onCheckedChange={(checked) => handleToggleChange(key, checked)}
                      />
                    </div>
                  )
                }

                if (setting.type === "slider") {
                  const sliderSetting = setting as SliderSetting
                  return (
                    <div key={key} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor={key}>{setting.name}</Label>
                        <span className="text-sm text-muted-foreground">{sliderSetting.value}</span>
                      </div>
                      {setting.info && <p className="text-sm text-muted-foreground">{setting.info}</p>}
                      <Slider
                        id={key}
                        min={sliderSetting.detail.min}
                        max={sliderSetting.detail.max}
                        step={sliderSetting.detail.step}
                        value={[sliderSetting.value]}
                        onValueChange={(value) => handleSliderChange(key, value)}
                        className={sliderSetting.detail.hue ? "hue-slider" : ""}
                      />
                    </div>
                  )
                }

                if (setting.type === "radio") {
                  const radioSetting = setting as RadioSetting
                  return (
                    <div key={key} className="space-y-2">
                      <Label>{setting.name}</Label>
                      {setting.info && <p className="text-sm text-muted-foreground">{setting.info}</p>}
                      <RadioGroup
                        value={radioSetting.value.toString()}
                        onValueChange={(value) => handleRadioChange(key, value)}
                      >
                        {radioSetting.detail.options.map((option, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <RadioGroupItem value={index.toString()} id={`${key}-${index}`} />
                            <Label htmlFor={`${key}-${index}`}>{option}</Label>
                          </div>
                        ))}
                        {radioSetting.detail.customOption && (
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem
                              value={radioSetting.detail.options.length.toString()}
                              id={`${key}-custom`}
                            />
                            <Label htmlFor={`${key}-custom`}>Custom:</Label>
                            <Input
                              value={radioSetting.detail.customOptionValue || ""}
                              onChange={(e) => handleCustomOptionChange(key, e.target.value)}
                              placeholder="Enter custom value"
                              className="flex-1"
                            />
                          </div>
                        )}
                      </RadioGroup>
                    </div>
                  )
                }

                return null
              })}
            </div>
          ))}

          <div className="pt-4 border-t">
            <Button onClick={resetToDefaults} variant="outline" className="w-full bg-transparent">
              Reset to Defaults
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
