import { Button, HStack, Input, useNumberInput } from "@chakra-ui/react"
import { useEffect } from "react"

export function ControlledNumberInput({
    max,
    min,
    step,
    defaultValue,
    setValue,
}: {
    max: number,
    min: number,
    step: number,
    defaultValue: number,
    setValue: (value: number) => void,
}) {
    const { valueAsNumber, getInputProps, getIncrementButtonProps, getDecrementButtonProps } =
      useNumberInput({
        step: step,
        defaultValue: defaultValue,
        min: min,
        max: max,
        precision: 2,
      })
  
    const inc = getIncrementButtonProps()
    const dec = getDecrementButtonProps()
    const input = getInputProps()

    useEffect(() => {
        setValue(valueAsNumber)
    }, [valueAsNumber])

    return (
      <HStack maxW='200px'>
        <Button size={'md'} {...dec}>-</Button>
        <Input size={'md'} {...input}/>
        <Button size={'md'} {...inc}>+</Button>
      </HStack>
    )
  }