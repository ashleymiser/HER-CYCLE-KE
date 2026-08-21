export default function QuestionBlock({ title, help, children }) {
  return (
    <div className="mb-7">
      <div className="font-semibold text-[15px] mb-1 text-plum">{title}</div>
      {help && <div className="text-xs mb-3 text-plum-light">{help}</div>}
      {children}
    </div>
  )
}
